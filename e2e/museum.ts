import { expect, type Page } from '@playwright/test'
import type { ExhibitionId } from '../src/museum/exhibitions'

/*
 * Helpers over the profile build's debug bridge (src/scene/DebugBridge.tsx). Positions
 * are world metres; yaw 0 faces north (-z), positive turns left.
 */

export type MuseumState = { space: string; zone: string | null; focus: string | null; prompt: string | null; ended: boolean; x: number; z: number; path: string; visited: string[] }

/** Collects console errors and page errors; `expectClean` fails the test on any. */
export function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return { errors, expectClean: () => expect(errors, 'console errors').toEqual([]) }
}

/** Opens a page of the museum and waits for its front door to open. */
export async function open(page: Page, path = '/') {
  await page.goto(path)
  await page.locator('#enter-museum:not([disabled]), #enter-guided:not([disabled])').first().waitFor({ timeout: 150_000 })
}

/** Enters walking. Pointer lock is faked: headless browsers may not grant it. */
export async function enterWalking(page: Page) {
  await page.click('#enter-museum')
  await page.evaluate(() => (window as any).__museum.setLocked(true))
}

/** Runs frames by hand (frame callbacks and a render), independent of real time. */
export const step = (page: Page, frames = 1) => page.evaluate((frames) => (window as any).__museum.step(frames), frames)

/** Steps frames in batches while real time passes (for things driven by timers as well as frames). */
export async function settle(page: Page, ms: number) {
  for (let left = ms; left > 0; left -= 250) {
    await page.waitForTimeout(250)
    await step(page, 15)
  }
}

export async function state(page: Page): Promise<MuseumState> {
  return page.evaluate(() => {
    const m = (window as any).__museum
    m.step(2)
    const s = m.store.get()
    return { space: s.spaceId, zone: s.zoneId, focus: s.focus?.id ?? null, prompt: s.focus?.prompt ?? null, ended: s.ended, x: m.camera.position.x, z: m.camera.position.z, path: location.pathname, visited: [...s.visited] }
  })
}

/** Walks in a straight line with collision (as the visitor would); returns where it stopped. */
export async function walkTo(page: Page, x: number, z: number) {
  return page.evaluate(([x, z]) => (window as any).__museum.walkTo(x, z) as { x: number; z: number; space: string }, [x, z] as const)
}

export const look = (page: Page, yaw: number, pitch = 0) => page.evaluate(([yaw, pitch]) => (window as any).__museum.look(yaw, pitch), [yaw, pitch] as const)

/** Presses E and lets a few frames run. */
export async function press(page: Page) {
  await page.keyboard.press('KeyE')
  await step(page, 10)
}

export async function exhibitionStatus(page: Page, id: ExhibitionId) {
  return page.evaluate((id) => (window as any).__museum.exhibitions.status(id) as string, id)
}

/** Waits (stepping frames) until an exhibition's rooms are loaded, mounted and compiled. */
export async function waitOpen(page: Page, id: ExhibitionId) {
  await expect.poll(async () => {
    await step(page, 5)
    return exhibitionStatus(page, id)
  }, { timeout: 120_000, intervals: [250] }).toBe('open')
}

/** The JavaScript chunks the page has fetched so far, by name. */
export function watchChunks(page: Page) {
  const chunks: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/assets/') && url.endsWith('.js')) chunks.push(url.split('/').pop()!.replace(/-[\w-]{8}\.js$/, ''))
  })
  return chunks
}

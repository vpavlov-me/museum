import { expect, test, type Page } from '@playwright/test'
import { TOURS } from '../src/museum/tour'
import { enterWalking, look, open, press, settle, state, step, waitOpen, walkTo, watchConsole } from './museum'

/*
 * Each exhibition walked on foot, with collision, along its guided route's points:
 * through its gates (pressing what they ask, or waiting), using every object that
 * invites it on the way, to its door back to the lobby.
 */

const REACHED = 0.15

// Nothing here reads pixels: a small canvas keeps software rendering quick.
test.use({ viewport: { width: 640, height: 400 } })
test.setTimeout(15 * 60_000)

/** Walks to a point; if something closed is in the way, does what it asks (or waits), and tries again. */
async function reach(page: Page, x: number, z: number, label: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const at = await walkTo(page, x, z)
    if (Math.hypot(at.x - x, at.z - z) < REACHED) return
    const here = await state(page)
    console.log(`  ${label}: stopped at [${at.x}, ${at.z}] short of [${x}, ${z}]${here.prompt ? `, pressing ${here.prompt}` : ', waiting'}`)
    if (here.prompt) await press(page)
    await settle(page, 3000)
  }
  const here = await state(page)
  throw new Error(`could not reach ${label} at [${x}, ${z}]: stopped at [${here.x.toFixed(2)}, ${here.z.toFixed(2)}] in ${here.space}`)
}

for (const id of ['permanent', 'archaeology', 'dark-patterns'] as const) {
  test(`walks ${id} from the lobby and back`, async ({ page }) => {
    const errors = watchConsole(page)
    await open(page, '/')
    await enterWalking(page)
    const stops = TOURS[id]

    for (const [i, stop] of stops.entries()) {
      for (const [x, z] of [...(stop.via ?? []), stop.at]) {
        await reach(page, x, z, stop.title)
        // The first stop walks through the exhibition's lobby door: wait for it to open.
        if (i === 0 && (await state(page)).space === 'lobby') await waitOpen(page, id)
      }
      await look(page, stop.yaw, stop.pitch ?? 0)
      await step(page, 12)
      const here = await state(page)
      // Use what invites it (a button, a find, a gate); the last stop's door is used below.
      if (here.prompt && i < stops.length - 1) {
        await press(page)
        await settle(page, 600)
      }
    }

    const end = await state(page)
    expect(end.prompt).toBe('RETURN TO THE LOBBY')
    await press(page)
    await settle(page, 1500)
    const back = await state(page)
    expect(back.space).toBe('lobby')
    expect(back.path).toBe('/')
    expect(back.visited).toContain(id)
    errors.expectClean()
  })
}

test('the front door leaves the museum', async ({ page }) => {
  const errors = watchConsole(page)
  await open(page, '/')
  await enterWalking(page)
  await page.evaluate(() => (window as any).__museum.teleport(-3, 34.4, Math.PI))
  await step(page, 6)
  expect((await state(page)).prompt).toBe('LEAVE THE MUSEUM')
  await press(page)
  await expect(page.locator('.colophon')).toHaveClass(/overlay--visible/)
  expect((await state(page)).ended).toBe(true)
  errors.expectClean()
})

import { expect, test, type Page } from '@playwright/test'
import { open, step, watchConsole } from './museum'

/*
 * The guided tour on a phone, with reduced motion (each walk is a cut): every route,
 * chosen in the lobby, to its last stop and back to the lobby, then out of the museum.
 */

test.use({ reducedMotion: 'reduce' })

const ACTIONS = /^(Press|Tap|Click|Continue|Accept all|Mark all as read|Verify|Retry|Reconnect|Brush|Decipher|Uncheck)$/

async function ui(page: Page) {
  await step(page, 4)
  return page.evaluate(() => ({
    counter: document.querySelector('.guided__stop .meta')?.textContent ?? '',
    title: document.querySelector('.guided__title')?.textContent ?? '',
    hint: document.querySelector('.guided__hint')?.textContent ?? '',
    action: document.querySelector('.guided__middle > .museum-button')?.textContent ?? null,
    nextDisabled: (document.querySelector('.guided__bar .museum-button:last-child') as HTMLButtonElement | null)?.disabled ?? true,
    space: (window as any).__museum.store.get().spaceId as string,
  }))
}

/** Lets the tour arrive (frames by hand) until Next is usable or something says why not. */
async function arrive(page: Page) {
  for (let i = 0; i < 80; i++) {
    const now = await ui(page)
    if (!now.nextDisabled || now.hint || now.action === 'Return to the lobby') return now
    await page.waitForTimeout(150)
  }
  return ui(page)
}

async function runRoute(page: Page, title: string) {
  await page.locator('.guided__choices .museum-button', { hasText: title }).click()
  let now = await arrive(page)
  for (let guard = 0; guard < 60; guard++) {
    const [index, count] = now.counter.split(' · ').pop()!.split(' / ').map(Number)
    if (now.action && ACTIONS.test(now.action)) {
      await page.locator('.guided__middle > .museum-button').click()
      await step(page, 60)
    }
    if (index === count) {
      now = await arrive(page)
      expect(now.action).toBe('Return to the lobby')
      await page.locator('.guided__middle > .museum-button').click()
      for (let i = 0; i < 20 && (await ui(page)).space !== 'lobby'; i++) await page.waitForTimeout(200)
      return
    }
    await page.locator('.guided__bar .museum-button:last-child').click()
    now = await arrive(page)
    // Stopped by a gate: do what it asks (or give it a moment), then go on.
    for (let tries = 0; now.hint && tries < 4; tries++) {
      if (now.action) await page.locator('.guided__middle > .museum-button').click()
      for (let i = 0; i < 12; i++) {
        await page.waitForTimeout(250)
        await step(page, 15)
      }
      await page.locator('.guided__bar .museum-button:last-child').click()
      now = await arrive(page)
    }
    expect(now.hint, `stuck at ${now.title}`).toBe('')
  }
  throw new Error(`route ${title} did not end`)
}

test('every guided route, from the lobby and back', async ({ page }) => {
  test.setTimeout(20 * 60_000)
  const errors = watchConsole(page)
  await open(page, '/')
  await page.click('#enter-guided')
  await expect(page.locator('.guided__choices .museum-button')).toHaveCount(3)

  for (const title of ['Permanent Exhibition', 'Interface Archaeology', 'Dark Patterns']) {
    await runRoute(page, title)
    expect((await ui(page)).space).toBe('lobby')
    await expect(page.locator('.guided__choices .museum-button', { hasText: title })).toContainText('visited')
  }

  await page.locator('.guided__leave').click()
  await expect(page.locator('.colophon')).toHaveClass(/overlay--visible/)
  errors.expectClean()
})

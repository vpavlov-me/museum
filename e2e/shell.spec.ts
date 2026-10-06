import { expect, test } from '@playwright/test'
import { DOORS } from '../src/museum/roomRegistry'
import { enterWalking, exhibitionStatus, open, state, step, waitOpen, walkTo, watchChunks, watchConsole } from './museum'

const EXHIBITION_CHUNKS = ['permanent', 'archaeology', 'dark-patterns']

test('opens into the lobby, with only the lobby loaded', async ({ page }) => {
  const errors = watchConsole(page)
  const chunks = watchChunks(page)
  await open(page, '/')
  await expect(page.locator('#enter-museum')).toHaveText('Enter the museum')
  await enterWalking(page)
  const here = await state(page)
  expect(here.space).toBe('lobby')
  expect(here.path).toBe('/')
  expect(chunks.filter((chunk) => EXHIBITION_CHUNKS.includes(chunk))).toEqual([])
  errors.expectClean()
})

for (const [id, door] of [
  ['permanent', DOORS.lobbyPermanent],
  ['archaeology', DOORS.lobbyArchaeology],
  ['dark-patterns', DOORS.lobbyDark],
] as const) {
  test(`walking up to its door loads ${id}, and the door opens`, async ({ page }) => {
    const errors = watchConsole(page)
    const chunks = watchChunks(page)
    await open(page, '/')
    await enterWalking(page)
    expect(await exhibitionStatus(page, id)).toBe('idle')
    // Shut: the visitor cannot pass until the rooms are ready.
    await walkTo(page, door.x, door.z + 3)
    await waitOpen(page, id)
    expect(chunks).toContain(id)
    await step(page, 90)
    await walkTo(page, door.x, door.z + 0.5)
    const through = await walkTo(page, door.x, door.z - 1.5)
    expect(through.space).not.toBe('lobby')
    expect((await state(page)).path).toBe(`/exhibitions/${id}`)
    errors.expectClean()
  })
}

for (const [path, id, title, space] of [
  ['/exhibitions/permanent', 'permanent', 'Permanent Exhibition', 'entrance'],
  ['/exhibitions/archaeology', 'archaeology', 'Interface Archaeology', 'archaeology'],
  ['/exhibitions/dark-patterns', 'dark-patterns', 'Dark Patterns', 'dark-patterns'],
] as const) {
  test(`a direct link starts in ${id}`, async ({ page }) => {
    const errors = watchConsole(page)
    const chunks = watchChunks(page)
    await open(page, path)
    await expect(page.locator('#enter-museum')).toHaveText(`Enter ${title}`)
    expect(chunks).toContain(id)
    await enterWalking(page)
    const here = await state(page)
    expect(here.space).toBe(space)
    expect(here.path).toBe(path)
    errors.expectClean()
  })
}

test('an unknown path starts in the lobby', async ({ page }) => {
  await open(page, '/exhibitions/nowhere')
  await expect(page.locator('#enter-museum')).toHaveText('Enter the museum')
})

test('the text version has every exhibition', async ({ page }) => {
  const errors = watchConsole(page)
  await open(page, '/')
  await page.getByRole('button', { name: 'Read the museum as text' }).click()
  const exhibitions = page.locator('.text-exhibition h2')
  await expect(exhibitions).toHaveText(['Permanent Exhibition', 'Interface Archaeology', 'Dark Patterns'])
  await expect(page.locator('.text-exhibition h3')).toContainText(['The Button', 'Things We Somehow Accepted', 'Interface States'])
  errors.expectClean()
})

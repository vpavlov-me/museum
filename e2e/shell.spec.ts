import { expect, test } from '@playwright/test'
import { EXHIBITIONS, OPEN_EXHIBITIONS } from '../src/museum/exhibitions'
import { DOORS, spaceAt } from '../src/museum/roomRegistry'
import { enterWalking, exhibitionStatus, open, settle, state, step, strayVisibility, waitOpen, walkTo, watchChunks, watchConsole } from './museum'

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

const LOBBY_DOOR = { permanent: DOORS.lobbyPermanent, archaeology: DOORS.lobbyArchaeology, 'dark-patterns': DOORS.lobbyDark }

for (const { id } of OPEN_EXHIBITIONS) {
  const door = LOBBY_DOOR[id]
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

for (const { id, slug, title, start } of OPEN_EXHIBITIONS) {
  const path = `/exhibitions/${slug}`
  const space = spaceAt(...start.at)?.id
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

    // What is around the start is drawn: compiling the wing must not leave it hidden.
    await settle(page, 400)
    expect(await strayVisibility(page)).toEqual([])
    errors.expectClean()
  })
}

// Exhibitions in preparation (#48): their doors are walled up, and a link to one starts in the lobby.
for (const { id, slug } of EXHIBITIONS.filter((exhibition) => exhibition.status !== 'open')) {
  test(`${id} is in preparation: its door is shut and its link starts in the lobby`, async ({ page }) => {
    const errors = watchConsole(page)
    const chunks = watchChunks(page)
    await open(page, `/exhibitions/${slug}`)
    await expect(page.locator('#enter-museum')).toHaveText('Enter the museum')
    await enterWalking(page)
    const door = LOBBY_DOOR[id]
    await walkTo(page, door.x, door.z + 3)
    const at = await walkTo(page, door.x, door.z - 1.5)
    expect(at.space).toBe('lobby')
    await settle(page, 1000)
    expect(chunks).not.toContain(id)
    errors.expectClean()
  })
}

test('an unknown path starts in the lobby', async ({ page }) => {
  await open(page, '/exhibitions/nowhere')
  await expect(page.locator('#enter-museum')).toHaveText('Enter the museum')
})

test('the text version has every open exhibition', async ({ page }) => {
  const errors = watchConsole(page)
  await open(page, '/')
  await page.getByRole('button', { name: 'Read the museum as text' }).click()
  const exhibitions = page.locator('.text-exhibition h2')
  await expect(exhibitions).toHaveText(OPEN_EXHIBITIONS.map((exhibition) => exhibition.title))
  await expect(page.locator('.text-exhibition h3')).toContainText(['The Button'])
  errors.expectClean()
})

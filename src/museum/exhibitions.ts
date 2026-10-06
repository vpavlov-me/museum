import type { ComponentType } from 'react'
import { ARCHAEOLOGY_ORIGIN } from './roomRegistry'

/*
 * The museum's exhibitions: what the lobby signs, the plan, the text version and the
 * URLs are built from. A small, fixed list (the museum is meant to hold three to five),
 * not a content system: each exhibition's rooms stay authored code, loaded on demand.
 *
 * The lobby is not an exhibition; it belongs to the museum and is always there.
 */

export type ExhibitionId = 'permanent' | 'archaeology' | 'temporary'

/** An exhibition's rooms, by space id: what its chunk exports. */
export type ExhibitionRooms = Record<string, ComponentType>

export type ExhibitionDefinition = {
  id: ExhibitionId
  number: string
  title: string
  subtitle: string
  status: 'open' | 'in-preparation'
  /** Its URL: /exhibitions/<slug>. */
  slug: string
  /** Order on the lobby wall and in the text version; 1 is the recommended start. */
  recommended: number
  /** The spaces it is made of (see roomRegistry). */
  spaces: string[]
  /** Its entrance in the lobby's north wall, world x. */
  door: number
  /** Where a visit that starts here (a direct link) puts the visitor, world [x, z], facing yaw. */
  start: { at: [number, number]; yaw: number }
  /** Its rooms, in their own chunk. */
  load?: () => Promise<{ default: ExhibitionRooms }>
}

const [ax, az] = ARCHAEOLOGY_ORIGIN

export const EXHIBITIONS: ExhibitionDefinition[] = [
  {
    id: 'permanent',
    number: '01',
    title: 'Permanent Exhibition',
    subtitle: 'Three rooms about objects, conventions and states.',
    status: 'open',
    slug: 'permanent',
    recommended: 1,
    spaces: ['entrance', 'the-button', 'passage', 'accepted', 'transition-03', 'states', 'colophon'],
    door: 0,
    start: { at: [0, 24.6], yaw: 0 },
    load: () => import('../rooms/permanent'),
  },
  {
    id: 'archaeology',
    number: '02',
    title: 'Interface Archaeology',
    subtitle: 'An excavation of digital interfaces from the early 21st century.',
    status: 'open',
    slug: 'archaeology',
    recommended: 2,
    spaces: ['archaeology-passage', 'archaeology'],
    door: ax,
    start: { at: [ax + 7, az - 9.2], yaw: 0 },
    load: () => import('../rooms/archaeology'),
  },
  {
    id: 'temporary',
    number: '03',
    title: 'Temporary Exhibition',
    subtitle: 'A smaller exhibition that changes.',
    status: 'in-preparation',
    slug: 'temporary',
    recommended: 3,
    spaces: [],
    door: -9,
    start: { at: [-9, 28], yaw: 0 },
  },
]

export const OPEN_EXHIBITIONS = EXHIBITIONS.filter((exhibition) => exhibition.status === 'open')

export const getExhibition = (id: string) => EXHIBITIONS.find((exhibition) => exhibition.id === id) ?? null

const BY_SPACE = new Map(EXHIBITIONS.flatMap((exhibition) => exhibition.spaces.map((space) => [space, exhibition.id] as const)))

/** The exhibition a space belongs to, or null for the lobby. */
export const exhibitionOf = (spaceId: string): ExhibitionId | null => BY_SPACE.get(spaceId) ?? null

/** The exhibition a URL path names (/exhibitions/<slug>), or null for the lobby. */
export function exhibitionFromPath(path: string): ExhibitionId | null {
  const match = /^\/exhibitions\/([a-z-]+)\/?$/.exec(path)
  const exhibition = match ? EXHIBITIONS.find((e) => e.slug === match[1] && e.status === 'open') : null
  return exhibition?.id ?? null
}

export const pathOf = (id: ExhibitionId | null) => (id ? `/exhibitions/${getExhibition(id)?.slug}` : '/')

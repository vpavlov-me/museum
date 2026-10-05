import type { RefObject } from 'react'

/** Shared artifact size, metres. */
export const BUTTON = { width: 1.9, height: 0.62 }

export type ArtifactProps = {
  label: string
  /** Clock time of the last press; -Infinity before the first one. */
  pressedAt: RefObject<number>
}

/** Seconds since the last press, or Infinity if it never happened. */
export const sincePress = (pressedAt: RefObject<number>, now: number) => now - (pressedAt.current ?? -Infinity)

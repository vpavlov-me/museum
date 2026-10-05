import { useCallback } from 'react'
import { PointerLockControls } from '@react-three/drei'

/** Mouse look. Pointer lock is requested from the intro and pause buttons; Esc always releases it. */
export function Controls({ onLockChange }: { onLockChange: (locked: boolean) => void }) {
  const handleLock = useCallback(() => onLockChange(true), [onLockChange])
  const handleUnlock = useCallback(() => onLockChange(false), [onLockChange])

  return (
    <PointerLockControls
      selector="#enter-museum, #resume-museum"
      onLock={handleLock}
      onUnlock={handleUnlock}
      pointerSpeed={0.8}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.78}
    />
  )
}

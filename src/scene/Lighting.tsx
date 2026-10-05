/** Museum-wide ambient light. Rooms add their own sparse point lights for exhibits. */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#d9d4c8', '#1a1a1a', 0.9]} />
      <directionalLight position={[3, 7, 10]} intensity={0.9} />
    </>
  )
}

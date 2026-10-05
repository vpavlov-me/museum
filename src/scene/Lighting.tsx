/**
 * Museum-wide base light: a warm sky and a dark ground, so floors read lighter than
 * ceilings and walls fall in between, plus one weak key that separates wall planes.
 * How bright each space feels comes mostly from its palette; realtime light is
 * reserved for exhibits (see Downlight).
 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#ebe7df', '#2a2724', 4]} />
      <directionalLight position={[-5, 9, 4]} intensity={1.4} color="#fff6ea" />
    </>
  )
}

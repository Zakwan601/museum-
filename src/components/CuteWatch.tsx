export default function CuteWatch() {
  return <>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.064, .012, 6, 20]} /><meshStandardMaterial color="#e9a9bf" roughness={.65} /></mesh>
    <mesh position={[0, 0, .07]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.038, .038, .012, 20]} /><meshStandardMaterial color="#c9957d" metalness={.45} roughness={.35} /></mesh>
    <mesh position={[0, 0, .078]}><circleGeometry args={[.032, 20]} /><meshStandardMaterial color="#fff6e8" roughness={.55} /></mesh>
    <mesh position={[0, 0, .081]}><torusGeometry args={[.034, .003, 5, 20]} /><meshStandardMaterial color="#e1b69a" metalness={.4} roughness={.4} /></mesh>
    <mesh position={[-.006, .006, .083]} rotation={[0, 0, -.75]}><boxGeometry args={[.004, .020, .003]} /><meshStandardMaterial color="#946777" /></mesh>
    <mesh position={[.007, .008, .083]} rotation={[0, 0, .75]}><boxGeometry args={[.003, .026, .003]} /><meshStandardMaterial color="#946777" /></mesh>
    <mesh position={[0, 0, .085]}><sphereGeometry args={[.0045, 8, 5]} /><meshStandardMaterial color="#da839f" /></mesh>
  </>;
}

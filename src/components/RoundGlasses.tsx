import * as THREE from 'three';

const rim = new THREE.TorusGeometry(.127, .006, 6, 40);
const lens = new THREE.CircleGeometry(.121, 40);
function wire(points: number[][], radius: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 16, radius, 6, false);
}
const bridge = wire([[-.022, .012, .396], [0, .026, .403], [.022, .012, .396]], .0045);
const temple = wire([[.274, 0, .395], [.331, .006, .36], [.397, .012, .16], [.402, -.025, .055]], .0045);

// Attached to the head, outside the blinking eye group; no extra animation work.
export default function RoundGlasses() {
  return <group name="rose-gold-round-glasses" position={[0, -.005, 0]}>
    {[-1, 1].map(side => <group key={side}>
      <mesh geometry={rim} position={[side * .149, 0, .395]}>
        <meshStandardMaterial color="#e6b4b9" metalness={.65} roughness={.3} />
      </mesh>
      <mesh geometry={lens} position={[side * .149, 0, .394]} renderOrder={1}>
        <meshStandardMaterial color="#ecf6ff" transparent opacity={.055} depthWrite={false} roughness={.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={temple} scale={[side, 1, 1]}>
        <meshStandardMaterial color="#c49b8c" metalness={.7} roughness={.3} />
      </mesh>
    </group>)}
    <mesh geometry={bridge}>
      <meshStandardMaterial color="#c49b8c" metalness={.7} roughness={.3} />
    </mesh>
  </group>;
}

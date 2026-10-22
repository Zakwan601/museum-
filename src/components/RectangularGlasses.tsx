import * as THREE from 'three';

function outline(inset = 0) {
  const shape = new THREE.Shape();
  const w = .132 - inset, h = .102 - inset;
  shape.moveTo(-w + .025, h);
  shape.quadraticCurveTo(0, h + .008, w - .025, h);
  shape.quadraticCurveTo(w + .006, h, w, h - .03);
  shape.lineTo(w - .018, -h + .035);
  shape.quadraticCurveTo(w - .024, -h, w - .055, -h);
  shape.lineTo(-w + .055, -h);
  shape.quadraticCurveTo(-w + .024, -h, -w + .018, -h + .035);
  shape.lineTo(-w, h - .03);
  shape.quadraticCurveTo(-w - .006, h, -w + .025, h);
  return shape;
}
const frameShape = outline();
frameShape.holes.push(new THREE.Path(outline(.014).getPoints(8).reverse()));
const frame = new THREE.ExtrudeGeometry(frameShape, { depth: .012, bevelEnabled: true, bevelSize: .003, bevelThickness: .002, bevelSegments: 2, steps: 1, curveSegments: 8 });
const lens = new THREE.ShapeGeometry(outline(.017), 8);
function wire(points: number[][], radius: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 12, radius, 6, false);
}
const bridge = wire([[-.025, .04, .401], [0, .047, .405], [.025, .04, .401]], .012);
const temple = wire([[.278, .065, .4], [.345, .065, .32], [.403, .035, .12], [.405, -.025, .055]], .009);
const black = new THREE.MeshStandardMaterial({ color: '#101114', roughness: .3 });

export default function RectangularGlasses() {
  return <group name="black-rectangular-glasses" position={[0, -.005, 0]}>
    {[-1, 1].map(side => <group key={side}>
      <mesh geometry={frame} material={black} position={[side * .15, 0, .395]} />
      <mesh geometry={lens} position={[side * .15, 0, .4]} renderOrder={1}>
        <meshStandardMaterial color="#ecf6ff" transparent opacity={.045} depthWrite={false} roughness={.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={temple} material={black} scale={[side, 1, 1]} />
    </group>)}
    <mesh geometry={bridge} material={black} />
  </group>;
}

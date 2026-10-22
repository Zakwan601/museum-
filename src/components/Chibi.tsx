import { useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared superellipsoid surfaces give the sculpt a rounded jaw and soft flat soles.
function sculpt(power: number, rings = 12, segments = 20) {
  const vertices: number[] = [], indices: number[] = [];
  const signed = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), power);
  for (let y = 0; y <= rings; y++) for (let x = 0; x <= segments; x++) {
    const v = Math.PI * y / rings, u = Math.PI * 2 * x / segments;
    vertices.push(signed(Math.sin(v)) * signed(Math.cos(u)), signed(Math.cos(v)), signed(Math.sin(v)) * signed(Math.sin(u)));
  }
  for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
    const a = y * (segments + 1) + x, b = a + segments + 1;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}
const soft = sculpt(.84), round = sculpt(1, 8, 12);
const profile = (points: number[][]) => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 24);
const sweater = profile([[0, 0], [.19, 0], [.25, .035], [.265, .12], [.24, .36], [.2, .43], [.12, .46], [0, .46]]);
const skirt = profile([[0, 0], [.31, 0], [.33, .035], [.3, .12], [.24, .29], [.19, .32], [0, .32]]);
function strand(points: number[][], width: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, 12, width, 7, false), positions = g.getAttribute('position');
  for (let i = 0; i <= 12; i++) {
    const center = curve.getPointAt(i / 12), taper = .12 + .88 * Math.pow(Math.sin(Math.PI * i / 12), .45);
    for (let j = 0; j <= 7; j++) {
      const k = i * 8 + j;
      positions.setXYZ(k, center.x + (positions.getX(k) - center.x) * taper, center.y + (positions.getY(k) - center.y) * taper, center.z + (positions.getZ(k) - center.z) * taper);
    }
  }
  g.computeVertexNormals(); return g;
}
const smile = strand([[-.065, 0, 0], [0, -.025, .005], [.065, 0, 0]], .009);
const heartShape = new THREE.Shape();
heartShape.moveTo(0, -.05);
heartShape.bezierCurveTo(-.12, .015, -.065, .1, 0, .045);
heartShape.bezierCurveTo(.065, .1, .12, .015, 0, -.05);
const heart = new THREE.ExtrudeGeometry(heartShape, { depth: .018, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .008, bevelThickness: .008, curveSegments: 8 });
interface Props { variant: 'lavender' | 'rose'; motion: MutableRefObject<number>; kissPose?: MutableRefObject<number>; photoPose?: MutableRefObject<number>; reducedMotion?: boolean }
export default function Chibi({ variant, motion, kissPose, photoPose, reducedMotion = false }: Props) {
  const rose = variant === 'rose';
  const root = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null), eyes = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const phase = useRef(rose ? 1.1 : 0), blend = useRef(0);
  const mouth = useRef<THREE.Mesh>(null);
  const materials = useMemo(() => {
    const mat = (color: string, roughness = .6) => new THREE.MeshStandardMaterial({ color, roughness });
    return {
      skin: mat(rose ? '#f8cfba' : '#edc2a5'), hair: mat(rose ? '#704437' : '#383047', .42),
      hairLight: mat(rose ? '#8c5642' : '#50415d', .48), outfit: mat(rose ? '#eeb7c6' : '#b9b5e2'),
      trim: mat('#fff0dc'), dark: mat('#30283c', .18), iris: mat(rose ? '#926443' : '#686a98', .22),
      shine: new THREE.MeshBasicMaterial({ color: '#fffaf3' }), blush: mat('#ed919f'), sole: mat('#ddd1cf'), gold: mat('#efce88', .35),
    };
  }, [rose]);
  const hair = useMemo(() => Array.from({ length: rose ? 7 : 6 }, (_, i) => {
    const x = (i - (rose ? 3 : 2.5)) * .108;
    return strand([[x * .6, .44, -.02], [x, .38, .21], [x + (rose ? -.055 : .07), .18 + Math.abs(x) * .16, .325], [x + (rose ? -.08 : .09), .09 + Math.abs(x) * .23, .31]], .078);
  }), [rose]);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, .05), time = clock.elapsedTime + (rose ? 1.3 : 0);
    const affection = kissPose?.current ?? 0;
    const posing = photoPose?.current ?? 0;
    blend.current = THREE.MathUtils.damp(blend.current, Math.min(motion.current / 2, 1), 9, dt);
    // Distance-driven steps stop cleanly instead of cycling against a wall.
    phase.current += dt * Math.min(motion.current, 5) * 5.5;
    const swing = Math.sin(phase.current) * .48 * blend.current;
    if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
      leftArm.current.rotation.x = swing - affection * .65; rightArm.current.rotation.x = -swing - affection * .65;
      leftArm.current.rotation.z = .12 + Math.sin(time * 1.7) * .035;
      rightArm.current.rotation.z = -.12 - Math.sin(time * 1.7) * .035;
      // Reach toward the partner with the inner hand; keep outer arms relaxed.
      if (rose) leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, -.68, posing);
      else rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, .68, posing);
      leftLeg.current.rotation.x = -swing; rightLeg.current.rotation.x = swing;
    }
    if (root.current) { root.current.position.y = .012 + Math.sin(time * 2) * .008 + Math.abs(Math.sin(phase.current)) * .035 * blend.current; root.current.rotation.z = Math.sin(phase.current) * .018 * blend.current; }
    if (head.current) { head.current.rotation.z = Math.sin(time * 1.1) * .025 * (1 - affection) + affection * (rose ? -.1 : .1); head.current.rotation.x = -.06 * affection; head.current.rotation.y = Math.sin(time * .65) * .045 * (1 - blend.current) * (1 - affection); }
    if (head.current) head.current.rotation.z += posing * (rose ? .08 : -.08);
    if (reducedMotion) {
      if (root.current) { root.current.position.y = .012; root.current.rotation.z = 0; }
      if (head.current) { head.current.rotation.y = 0; head.current.rotation.z = affection * (rose ? -.1 : .1) + posing * (rose ? .08 : -.08); }
    }
    if (eyes.current) { const blink = time % 4.7; eyes.current.scale.y = (blink < .14 ? Math.max(.08, Math.abs(blink - .07) / .07) : 1) * (1 - affection * .9); }
    if (mouth.current) { mouth.current.scale.set(1 - affection * .65, 1 + affection * .3, 1); mouth.current.position.z = .332 + affection * .045; }
  });
  const pebble = (key: string, position: [number, number, number], scale: [number, number, number], material: THREE.Material, smooth = false) =>
    <mesh key={key} geometry={smooth ? round : soft} material={material} position={position} scale={scale} castShadow={!smooth && Math.max(...scale) > .1} />;
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .008, 0]} scale={[1, .72, 1]}>
      <circleGeometry args={[.43, 24]} /><meshBasicMaterial color="#392c43" transparent opacity={.18} depthWrite={false} />
    </mesh>
    <group ref={root}>
      <mesh geometry={sweater} material={materials.outfit} position={[0, .49, 0]} castShadow />
      {rose && <mesh geometry={skirt} material={materials.outfit} position={[0, .39, 0]} castShadow />}
      {pebble('collar', [0, .915, .01], [.15, .04, .13], materials.trim)}
      <mesh geometry={heart} material={materials.gold} position={[0, .76, .245]} scale={.6} />
      {[-1, 1].map(side => <group key={side} ref={side < 0 ? leftArm : rightArm} position={[side * .245, .86, 0]}>
        {pebble('sleeve', [side * .035, -.125, 0], [.095, .17, .1], materials.outfit)}
        {pebble('cuff', [side * .04, -.255, .005], [.08, .035, .085], materials.trim)}
        {pebble('hand', [side * .04, -.31, .015], [.073, .075, .065], materials.skin)}
        {pebble('thumb', [side * -.008, -.295, .06], [.03, .04, .03], materials.skin)}
      </group>)}
      {[-1, 1].map(side => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * .13, .49, 0]}>
        {pebble('leg', [0, -.16, 0], [.087, .185, .09], rose ? materials.skin : materials.hairLight)}
        {pebble('sock', [0, -.29, .005], [.09, .07, .095], materials.trim)}
        {pebble('sole', [0, -.445, .06], [.117, .04, .18], materials.sole)}
        {pebble('shoe', [0, -.395, .06], [.115, .072, .17], materials.outfit)}
        {pebble('strap', [0, -.35, .085], [.1, .018, .04], materials.trim)}
      </group>)}
      <group ref={head} position={[0, 1.23, 0]}>
        {pebble('backHair', [0, .06, -.065], [.435, rose ? .47 : .395, .335], materials.hair)}
        {rose && [-1, 1].map(side => pebble(`bob${side}`, [side * .33, -.16, -.07], [.13, .29, .235], materials.hair))}
        {pebble('face', [0, 0, .035], [.389, .345, .31], materials.skin)}
        {[-1, 1].map(side => <group key={side}>
          {pebble('ear', [side * .38, -.045, .04], [.067, .095, .06], materials.skin)}
          {pebble('earInner', [side * .403, -.045, .083], [.026, .044, .018], materials.blush)}
          {pebble('cheek', [side * .235, -.13, .302], [.077, .036, .012], materials.blush, true)}
          {pebble('brow', [side * .145, .135, .326], [.068, .015, .012], materials.hair)}
        </group>)}
        <group ref={eyes}>
          {[-1, 1].map(side => <group key={side} position={[side * .146, -.005, .333]}>
            {pebble('eye', [0, 0, 0], [.068, .09, .025], materials.dark, true)}
            {pebble('iris', [0, -.022, .02], [.044, .051, .012], materials.iris, true)}
            {pebble('pupil', [0, .003, .03], [.029, .052, .008], materials.dark, true)}
            {pebble('sparkle', [-.018, .035, .036], [.019, .023, .008], materials.shine, true)}
            {pebble('glint', [.023, -.027, .033], [.009, .011, .006], materials.shine, true)}
          </group>)}
        </group>
        {pebble('nose', [0, -.095, .35], [.032, .027, .035], materials.skin)}
        <mesh ref={mouth} geometry={smile} material={materials.hair} position={[0, -.185, .332]} />
        {hair.map((geometry, i) => <mesh key={i} geometry={geometry} material={i % 3 === 0 ? materials.hairLight : materials.hair} castShadow />)}
        {rose ? <group position={[.34, .24, .19]} rotation={[0, 0, -.28]}>
          {pebble('bowL', [-.07, 0, 0], [.085, .058, .04], materials.outfit)}
          {pebble('bowR', [.07, 0, 0], [.085, .058, .04], materials.outfit)}
          {pebble('bowKnot', [0, 0, .025], [.035, .036, .03], materials.gold)}
        </group> : <mesh geometry={heart} material={materials.outfit} position={[-.32, .23, .18]} rotation={[0, -.35, .25]} scale={.5} />}
      </group>
    </group>
  </>;
}


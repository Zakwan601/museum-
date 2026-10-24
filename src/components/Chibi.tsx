import { endingFrozen } from '../lib/ending';
import type { EndingState } from '../lib/ending';
import { useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RoundGlasses from './RoundGlasses';
import RectangularGlasses from './RectangularGlasses';
import type { GiftGrip } from '../lib/bouquet';

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
const shirt = profile([[0, 0], [.21, 0], [.235, .025], [.24, .16], [.23, .35], [.195, .43], [.115, .46], [0, .46]]);
const tuckedShirt = profile([[0, 0], [.2, 0], [.213, .04], [.232, .18], [.23, .25], [.195, .33], [.115, .36], [0, .36]]);
// A single continuous pleated surface keeps the frock light and sculpted.
const frock = (() => {
  const g = profile([[0, 0], [.32, 0], [.325, .025], [.3, .13], [.25, .31], [.225, .35], [0, .35]]);
  const positions = g.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i), y = positions.getY(i);
    const fold = 1 + .035 * Math.cos(Math.atan2(z, x) * 12) * (1 - y / .4);
    positions.setXYZ(i, x * fold, y, z * fold);
  }
  g.computeVertexNormals(); return g;
})();
function cloth(outline: number[][], depth = .008) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .004, bevelThickness: .003, bevelSegments: 2, steps: 1, curveSegments: 4 });
}
const collar = cloth([[.035, .935], [.105, .95], [.19, .89], [.115, .825], [.065, .875]]);
// Two broad white panels form the reference's open V-shaped scarf.
const scarf = cloth([[.085, .95], [.19, .915], [.22, .83], [.125, .68], [-.085, .6], [-.15, .65], [.055, .77]]);
const scarfTail = cloth([[-.1, .66], [-.005, .645], [.005, .38], [-.09, .36], [-.12, .46]]);
const placket = cloth([[-.012, .865], [.012, .865], [.012, .625], [-.012, .625]], .003);
const pocket = cloth([[.08, .82], [.165, .82], [.165, .745], [.12, .725], [.08, .745]], .003);
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
interface Props { wishEyes?: MutableRefObject<number>; ending?: EndingState; variant: 'lavender' | 'rose'; motion: MutableRefObject<number>; giftGrip?: MutableRefObject<GiftGrip>; kissPose?: MutableRefObject<number>; kissHands?: MutableRefObject<[THREE.Vector3, THREE.Vector3]>; photoPose?: MutableRefObject<number>; reducedMotion?: boolean; poseSide?: -1 | 1 }
export default function Chibi({ wishEyes, ending, variant, motion, giftGrip, kissPose, kissHands, photoPose, reducedMotion = false, poseSide = variant === 'rose' ? 1 : -1 }: Props) {
  const rose = variant === 'rose';
  const root = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null), eyes = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const phase = useRef(rose ? 1.1 : 0), blend = useRef(0);
  const mouth = useRef<THREE.Mesh>(null);
  const grip = useMemo(() => ({ target: new THREE.Vector3(), direction: new THREE.Vector3(), rest: new THREE.Vector3(), rotation: new THREE.Quaternion() }), []);
  const materials = useMemo(() => {
    const mat = (color: string, roughness = .6) => new THREE.MeshStandardMaterial({ color, roughness });
    return {
      skin: mat(rose ? '#f8cfba' : '#edc2a5'), hair: mat(rose ? '#704437' : '#08090b', .42),
      hairLight: mat(rose ? '#8c5642' : '#08090b', .48), outfit: mat('#2456c4', .78),
      trousers: mat('#c6aa76', .85), white: mat('#faf9f5', .8), seam: mat('#1f47a1', .8), belt: mat('#292522', .65),
      buckle: new THREE.MeshStandardMaterial({ color: '#c9c8c3', metalness: .75, roughness: .3 }),
      trim: mat('#fff0dc'), dark: mat('#30283c', .18), iris: mat(rose ? '#926443' : '#686a98', .22),
      shine: new THREE.MeshBasicMaterial({ color: '#fffaf3' }), blush: mat('#ed919f'), sole: mat('#dedfdf'),
    };
  }, [rose]);
  const hair = useMemo(() => {
    if (!rose) return [
      // Gentle S-shaped locks, rather than tight ringlets or spherical clumps.
      ...Array.from({ length: 8 }, (_, i) => {
        const x = (i - 3.5) * .09, lift = Math.abs(x) * .17;
        return strand([[x * .7, .39, .02], [x - .025, .37, .17], [x + .035, .28, .28], [x + .015, .17 + lift, .34], [x - .035, .125 + lift, .325], [x - .06, .165 + lift, .315]], .062);
      }),
      ...Array.from({ length: 6 }, (_, i) => {
        const x = (i - 2.5) * .115;
        return strand([[x * .7, .25, -.28], [x - .03, .39, -.17], [x + .035, .445, -.04], [x + .055, .405, .1], [x, .365, .16]], .067);
      }),
    ];
    return Array.from({ length: 7 }, (_, i) => {
    const x = (i - (rose ? 3 : 2.5)) * .108;
    return strand([[x * .6, .44, -.02], [x, .38, .21], [x + (rose ? -.055 : .07), .18 + Math.abs(x) * .16, .325], [x + (rose ? -.08 : .09), .09 + Math.abs(x) * .23, .31]], .078);
    });
  }, [rose]);
  useFrame(({ clock }, delta) => {
    if (ending && endingFrozen(ending)) { if (eyes.current) eyes.current.scale.y = 1; return; }
    const dt = Math.min(delta, .05), time = clock.elapsedTime + (rose ? 1.3 : 0);
    const affection = kissPose?.current ?? 0;
    const posing = photoPose?.current ?? 0;
    blend.current = THREE.MathUtils.damp(blend.current, Math.min(motion.current / 2, 1), 9, dt);
    // Distance-driven steps stop cleanly instead of cycling against a wall.
    phase.current += dt * Math.min(motion.current, 5) * 5.5;
    const swing = Math.sin(phase.current) * .48 * blend.current;
    if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
      leftArm.current.scale.set(1, 1, 1); rightArm.current.scale.set(1, 1, 1);
      leftArm.current.rotation.y = 0; rightArm.current.rotation.y = 0;
      leftArm.current.rotation.x = swing - affection * .65; rightArm.current.rotation.x = -swing - affection * .65;
      leftArm.current.rotation.z = .12 + Math.sin(time * 1.7) * .035;
      rightArm.current.rotation.z = -.12 - Math.sin(time * 1.7) * .035;
      // Reach toward the partner with the inner hand; keep outer arms relaxed.
      if (poseSide > 0) leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, -.68, posing);
      else rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, .68, posing);
      leftLeg.current.rotation.x = -swing; rightLeg.current.rotation.x = swing;
    }
    if (root.current) { root.current.position.y = .012 + Math.sin(time * 2) * .008 + Math.abs(Math.sin(phase.current)) * .035 * blend.current; root.current.rotation.z = Math.sin(phase.current) * .018 * blend.current; }
    if (head.current) { head.current.rotation.z = Math.sin(time * 1.1) * .025 * (1 - affection) - affection * poseSide * .1; head.current.rotation.x = -.06 * affection; head.current.rotation.y = Math.sin(time * .65) * .045 * (1 - blend.current) * (1 - affection); }
    if (head.current) head.current.rotation.z += posing * poseSide * .08;
    if (reducedMotion) {
      if (root.current) { root.current.position.y = .012; root.current.rotation.z = 0; }
      if (head.current) { head.current.rotation.y = 0; head.current.rotation.z = -affection * poseSide * .1 + posing * poseSide * .08; }
    }
    if (eyes.current) { const blink = time % 4.7; eyes.current.scale.y = (blink < .14 ? Math.max(.08, Math.abs(blink - .07) / .07) : 1) * (1 - affection * .9) * (1 - (wishEyes?.current ?? 0) * .96); }
    if (mouth.current) { mouth.current.scale.set(1 - affection * .65, 1 + affection * .3, 1); mouth.current.position.z = .332 + affection * .045; }
    if (affection > 0 && kissHands && root.current) {
      // Solve the actual hand endpoint after idle motion and height scaling.
      // Opposite-facing partners use opposite local arms for each grip point.
      root.current.updateWorldMatrix(true, false);
      for (const side of [-1, 1]) {
        const arm = side < 0 ? leftArm.current : rightArm.current;
        if (!arm) continue;
        const index = (rose ? side < 0 : side > 0) ? 0 : 1;
        grip.target.copy(kissHands.current[index]);
        root.current.worldToLocal(grip.target);
        grip.target.z -= .025;
        grip.direction.copy(grip.target).sub(arm.position);
        const reach = Math.sqrt(Math.max(.01, grip.direction.lengthSq() - .04 ** 2 - .015 ** 2)) / .31;
        arm.scale.y = THREE.MathUtils.lerp(1, reach, affection);
        grip.rest.set(side * .04, -.31 * reach, .015).normalize();
        grip.rotation.setFromUnitVectors(grip.rest, grip.direction.normalize());
        arm.quaternion.slerp(grip.rotation, affection);
      }
    }
    if (giftGrip && giftGrip.current.amount > 0 && root.current) {
      root.current.updateWorldMatrix(true, false);
      const amount = giftGrip.current.amount;
      for (const side of [-1, 1]) {
        const arm = side < 0 ? leftArm.current : rightArm.current;
        if (!arm) continue;
        grip.target.copy(giftGrip.current.hands[side < 0 ? 0 : 1]); root.current.worldToLocal(grip.target);
        grip.direction.copy(grip.target).sub(arm.position);
        const reach = Math.sqrt(Math.max(.01, grip.direction.lengthSq() - .04 ** 2 - .015 ** 2)) / .31;
        arm.scale.y = THREE.MathUtils.lerp(1, reach, amount);
        grip.rest.set(side * .04, -.31 * reach, .015).normalize();
        grip.rotation.setFromUnitVectors(grip.rest, grip.direction.normalize()); arm.quaternion.slerp(grip.rotation, amount);
      }
    }
  });
  const pebble = (key: string, position: [number, number, number], scale: [number, number, number], material: THREE.Material, smooth = false) =>
    <mesh key={key} geometry={smooth ? round : soft} material={material} position={position} scale={scale} castShadow={!smooth && Math.max(...scale) > .1} />;
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .008, 0]} scale={[1, .72, 1]}>
      <circleGeometry args={[.43, 24]} /><meshBasicMaterial color="#392c43" transparent opacity={.18} depthWrite={false} />
    </mesh>
    <group ref={root} scale={[1, rose ? 1 : 1.055, 1]}>
      <mesh geometry={rose ? shirt : tuckedShirt} material={materials.outfit} position={[0, rose ? .49 : .59, 0]} scale={[1, 1, rose ? 1 : .85]} castShadow />
      {rose ? <>
        <mesh geometry={frock} material={materials.outfit} position={[0, .32, 0]} castShadow />
        <mesh geometry={scarfTail} material={materials.white} position={[0, 0, .265]} />
        {[-1, 1].map(side => <mesh key={side} geometry={scarf} material={materials.white} scale={[side, 1, 1]} position={[0, 0, .275]} />)}
        {pebble('scarfBack', [0, .915, -.12], [.145, .035, .065], materials.white)}
      </> : <>
        {pebble('waist', [0, .535, 0], [.215, .07, .178], materials.trousers)}
        <mesh name="trouser-belt" material={materials.belt} position={[0, .595, 0]} scale={[.22, 1, .184]}>
          <cylinderGeometry args={[1, 1, .038, 32]} />
        </mesh>
        {pebble('buckle', [0, .595, .19], [.034, .026, .009], materials.buckle)}
        {pebble('buckleOpening', [0, .595, .2], [.022, .015, .003], materials.belt)}
        <mesh geometry={placket} material={materials.seam} position={[0, 0, .202]} />
        <mesh geometry={pocket} material={materials.outfit} position={[0, 0, .207]} />
        {[.79, .7].map(y => pebble(`button${y}`, [0, y, .216], [.009, .009, .005], materials.white, true))}
        {[-1, 1].map(side => <mesh key={side} geometry={collar} material={materials.outfit} scale={[side, 1, 1]} position={[0, 0, .205]} />)}
      </>}
      {[-1, 1].map(side => <group key={side} name={side < 0 ? 'left-arm' : 'right-arm'} ref={side < 0 ? leftArm : rightArm} position={[side * .245, .86, 0]}>
        {pebble('sleeve', [side * .035, rose ? -.13 : -.085, 0], [.095, rose ? .17 : .115, .1], materials.outfit)}
        {pebble('cuff', [side * .04, rose ? -.255 : -.18, .005], [.084, .018, .09], materials.seam)}
        {!rose && pebble('forearm', [side * .04, -.235, .005], [.062, .088, .062], materials.skin)}
        {pebble('hand', [side * .04, -.31, .015], [.073, .075, .065], materials.skin)}
        {pebble('thumb', [side * -.008, -.295, .06], [.03, .04, .03], materials.skin)}
      </group>)}
      {[-1, 1].map(side => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * .13, .49, 0]}>
        {pebble('leg', [0, -.16, 0], [rose ? .098 : .092, .205, .1], rose ? materials.white : materials.trousers)}
        {pebble('sock', [0, -.29, .005], [.09, .07, .095], rose ? materials.white : materials.trousers)}
        {pebble('sole', [0, -.445, .06], [.117, .04, .18], materials.sole)}
        {pebble('shoe', [0, -.395, .06], [.115, .072, .17], materials.white)}
        {pebble('strap', [0, -.35, .085], [.1, .018, .04], materials.white)}
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
        {rose ? <RoundGlasses /> : <RectangularGlasses />}
        <mesh ref={mouth} geometry={smile} material={materials.hair} position={[0, -.185, .332]} />
        {hair.map((geometry, i) => <mesh key={i} geometry={geometry} material={i % 3 === 0 ? materials.hairLight : materials.hair} castShadow />)}

      </group>
    </group>
  </>;
}


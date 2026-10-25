import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CakeState } from '../lib/cake';
import { rose } from '../lib/roseGeometry';

const noRaycast = () => {};
type Piece = { p: number[]; s: number[]; r?: number[]; color: string };

// Cake-local coordinates: keep the central approach and the negative-Z camera
// corridor open. Outer bouquets stay below knees; balloons sit beyond the pair.
function layout() {
  const flowers: Piece[] = [], leaves: Piece[] = [], balloons: Piece[] = [];
  const wires: THREE.Vector3[][] = [], bulbs: Piece[] = [];
  for (const side of [-1, 1]) {
    const x = side * 2.4, z = .6;
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39996, radius = i ? .16 + (i % 3) * .075 : 0;
      flowers.push({ p: [x + Math.cos(a) * radius, .14 + (i % 3) * .045, z + Math.sin(a) * radius * .7], s: [1.6, 1.5, 1.6], r: [.12, a, (i % 2 ? 1 : -1) * .2], color: ['#d77f9d', '#efbacb', '#fff0da'][i % 3] });
    }
    for (let i = 0; i < 12; i++) {
      const a = i * 2.39996;
      leaves.push({ p: [x + Math.cos(a) * .31, .10, z + Math.sin(a) * .24], s: [.15, .025, .055], r: [0, -a, .12], color: i % 2 ? '#748665' : '#96a17d' });
    }
    // Three restrained balloons per side, away from the scene's central axis.
    for (let i = 0; i < 3; i++) {
      const bx = side * (4.15 + (i === 1 ? .32 : 0)), bz = 1.1 + (i - 1) * .34, by = 1.6 + (i === 1 ? .38 : 0);
      balloons.push({ p: [bx, by, bz], s: [.19, .25, .19], r: [0, 0, side * .08], color: ['#e8b1c3', '#f6eddc', '#cdb589'][i] });
      wires.push([new THREE.Vector3(bx, .10, bz), new THREE.Vector3(bx - side * .06, by * .5, bz + .025), new THREE.Vector3(bx, by - .24, bz)]);
    }
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      bulbs.push({ p: [x + Math.cos(a) * .32, .095, z + Math.sin(a) * .25], s: [.014, .014, .014], color: '#ffdb94' });
    }
  }
  const spiral = Array.from({ length: 65 }, (_, i) => {
    const t = i / 64, a = t * Math.PI * 6;
    return new THREE.Vector3(Math.cos(a) * (.085 + .09 * Math.abs(t - .5)), .13 + t * .47, Math.sin(a) * (.085 + .09 * Math.abs(t - .5)));
  });
  wires.push(spiral);
  for (let i = 0; i < 18; i++) bulbs.push({ p: spiral[Math.round(i / 17 * 64)].toArray(), s: [.012, .012, .012], color: '#ffdb94' });
  return { flowers, leaves, balloons, wires, bulbs };
}

function fill(mesh: THREE.InstancedMesh, pieces: Piece[]) {
  const o = new THREE.Object3D();
  pieces.forEach((p, i) => {
    o.position.fromArray(p.p); o.scale.fromArray(p.s); o.rotation.set(...(p.r || [0, 0, 0]) as [number, number, number]); o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix); mesh.setColorAt(i, new THREE.Color(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

export default function CakeDecorations({ cake, reducedMotion }: { cake: CakeState; reducedMotion: boolean }) {
  const data = useMemo(layout, []);
  const group = useRef<THREE.Group>(null);
  const flowers = useRef<THREE.InstancedMesh>(null), leaves = useRef<THREE.InstancedMesh>(null), balloons = useRef<THREE.InstancedMesh>(null), bulbs = useRef<THREE.InstancedMesh>(null);
  const assets = useMemo(() => {
    const heart = new THREE.Shape();
    heart.moveTo(0, -.06); heart.bezierCurveTo(-.14, .025, -.065, .13, 0, .055); heart.bezierCurveTo(.065, .13, .14, .025, 0, -.06);
    const wirePositions: number[] = [];
    data.wires.forEach(path => {
      const points = new THREE.CatmullRomCurve3(path).getPoints(path.length > 10 ? 80 : 12);
      for (let i = 1; i < points.length; i++) wirePositions.push(...points[i - 1].toArray(), ...points[i].toArray());
    });
    return {
      sphere: new THREE.SphereGeometry(1, 12, 8), heart: new THREE.ShapeGeometry(heart, 8),
      wire: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wirePositions, 3)),
      sparkles: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 12 }, (_, i) => [Math.sin(i * 2.4) * .65, .95 + (i % 4) * .16, .22 + Math.cos(i * 2.4) * .35]).flat(), 3)),
      flowerMaterial: new THREE.MeshStandardMaterial({ roughness: .8, side: THREE.DoubleSide }),
      leafMaterial: new THREE.MeshStandardMaterial({ roughness: .95 }),
      balloonMaterial: new THREE.MeshStandardMaterial({ roughness: .34, metalness: .12 }),
      glow: new THREE.MeshBasicMaterial({ color: '#ffe0a4', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
      wireMaterial: new THREE.LineBasicMaterial({ color: '#bda274', transparent: true, opacity: 0 }),
      sparkleMaterial: new THREE.PointsMaterial({ color: '#ffe7b0', size: .018, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    };
  }, [data]);
  useEffect(() => {
    fill(flowers.current!, data.flowers); fill(leaves.current!, data.leaves); fill(balloons.current!, data.balloons); fill(bulbs.current!, data.bulbs);
  }, [data]);
  useEffect(() => () => Object.values(assets).forEach(a => a.dispose()), [assets]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    // Derive everything from resettable reveal state; no timers or extra lights.
    group.current.visible = cake.reveal > .001;
    const amount = .008 + cake.reveal * .992;
    for (const m of [assets.flowerMaterial, assets.leafMaterial, assets.balloonMaterial]) m.color.setScalar(amount);
    const subtle = ['constellation', 'heartHold'].includes(cake.phase) ? .35 : 1;
    assets.glow.opacity = cake.reveal * .66 * subtle;
    assets.wireMaterial.opacity = cake.reveal * .35;
    assets.sparkleMaterial.opacity = cake.reveal * .45 * subtle * (reducedMotion ? .8 : .8 + .2 * Math.sin(clock.elapsedTime * 1.2));
  });
  return <group ref={group} name="cake-edge-decorations" visible={false}>
    <instancedMesh ref={flowers} name="cake-low-roses" args={[rose, assets.flowerMaterial, data.flowers.length]} raycast={noRaycast} dispose={null} />
    <instancedMesh ref={leaves} name="cake-low-greenery" args={[assets.sphere, assets.leafMaterial, data.leaves.length]} raycast={noRaycast} dispose={null} />
    <instancedMesh ref={balloons} name="cake-outer-balloons" args={[assets.sphere, assets.balloonMaterial, data.balloons.length]} raycast={noRaycast} dispose={null} />
    <instancedMesh ref={bulbs} name="cake-fairy-lights" args={[assets.sphere, assets.glow, data.bulbs.length]} raycast={noRaycast} dispose={null} />
    <lineSegments geometry={assets.wire} material={assets.wireMaterial} raycast={noRaycast} dispose={null} />
    {[-1, 1].map(side => <mesh name="cake-floating-heart" key={side} geometry={assets.heart} material={assets.glow} position={[side * .65, 2.05 + (side > 0 ? .15 : 0), .28]} rotation={[0, side * .3, side * -.18]} raycast={noRaycast} dispose={null} />)}
    <points name="cake-delicate-sparkles" geometry={assets.sparkles} material={assets.sparkleMaterial} raycast={noRaycast} dispose={null} />
  </group>;
}

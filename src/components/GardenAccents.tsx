import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gardenOutline } from '../lib/gardenLayout';
import type { CakeState } from '../lib/cake';

const noRaycast = () => {};
type Bucket = 'matte' | 'gold' | 'glow';
type Triple = [number, number, number];
function buildAccents() {
  const parts: Record<Bucket, THREE.BufferGeometry[]> = { matte: [], gold: [], glow: [] };
  const object = new THREE.Object3D();
  const stone = new THREE.SphereGeometry(1, 8, 5), leaf = new THREE.SphereGeometry(1, 6, 4);
  const box = new THREE.BoxGeometry(1, 1, 1), post = new THREE.CylinderGeometry(1, 1, 1, 8);
  const roof = new THREE.ConeGeometry(1, 1, 4);
  function add(bucket: Bucket, shape: THREE.BufferGeometry, color: string, position: Triple, scale: Triple = [1, 1, 1], rotation: Triple = [0, 0, 0]) {
    const copy = shape.index ? shape.toNonIndexed() : shape.clone();
    copy.deleteAttribute('uv');
    object.position.set(...position); object.scale.set(...scale); object.rotation.set(...rotation); object.updateMatrix(); copy.applyMatrix4(object.matrix);
    const tint = new THREE.Color(color), colors = new Float32Array(copy.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) { colors[i] = tint.r; colors[i + 1] = tint.g; colors[i + 2] = tint.b; }
    copy.setAttribute('color', new THREE.BufferAttribute(colors, 3)); parts[bucket].push(copy);
  }
  // Flat stepping stones follow the open approach, stopping before the cake.
  for (let i = 0; i < 10; i++) {
    const t = i / 9, x = Math.sin(t * Math.PI * 1.4) * .25 - .25 * t, z = .65 - t * 4.05;
    add('matte', stone, ['#e6d8c3', '#d9c9bf', '#e9deca'][i % 3], [x, .014, z], [.29 + (i % 3) * .025, .024, .20], [0, i * .51, 0]);
  }
  // Trailing foliage rests against the rock edge; nothing moves each frame.
  for (const [i, angle] of [.35, .75, 1.5, 2.0, 2.55, 3.2, 3.8, 5.5].entries()) {
    const radius = gardenOutline(angle), length = .85 + (i % 3) * .22;
    const points = Array.from({ length: 5 }, (_, j) => {
      const t = j / 4, r = radius * (1.025 - .02 * t);
      return new THREE.Vector3(Math.cos(angle) * r + Math.sin(t * 5 + i) * .035, .09 - t * length, Math.sin(angle) * r * .76);
    });
    const curve = new THREE.CatmullRomCurve3(points), vine = new THREE.TubeGeometry(curve, 8, .012, 4, false);
    add('matte', vine, '#72937a', [0, 0, 0]); vine.dispose();
    for (let j = 0; j < 6; j++) {
      const t = .12 + j * .145, p = curve.getPoint(t), side = j % 2 ? 1 : -1;
      add('matte', leaf, j % 2 ? '#9bb492' : '#7e9d80', [p.x + side * .065, p.y, p.z + .025], [.095, .038, .022], [.2, angle, side * .5]);
    }
    const end = curve.getPoint(.9);
    add('matte', leaf, i % 2 ? '#f1cad4' : '#e2d3ee', [end.x, end.y, end.z + .03], [.045, .07, .04], [0, angle, .2]);
  }
  // A small crescent sculpture stands on a side of the island, away from faces.
  const crescent = new THREE.Shape(); crescent.moveTo(.34, .72);
  crescent.bezierCurveTo(-.8, .85, -.9, -.8, .34, -.72);
  crescent.bezierCurveTo(-.15, -.4, -.15, .4, .34, .72);
  const moon = new THREE.ExtrudeGeometry(crescent, { depth: .045, bevelEnabled: true, bevelSegments: 1, bevelSize: .012, bevelThickness: .012, curveSegments: 12 });
  add('gold', moon, '#d9bd87', [-5.4, 1.3, 1.0], [1, 1, 1], [0, .5, -.08]); moon.dispose();
  add('gold', post, '#c5aa7e', [-5.4, .31, 1.0], [.025, .58, .025]);
  add('matte', stone, '#dfcfba', [-5.4, .04, 1.0], [.3, .055, .24]);
  for (let i = 0; i < 5; i++) add('matte', leaf, i % 2 ? '#92ac85' : '#7c9878', [-5.4 + Math.sin(i * 2.4) * .13, .16 + i * .06, 1.0 + Math.cos(i * 2.4) * .1], [.11, .035, .02], [0, i, .35]);
  // Two low lantern pairs flank the approach. Warm panels use no real lights.
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
    const x = side * (2.7 + i * .3), z = -2.8 + i * .27, h = i ? .33 : .46, r = i ? .085 : .11;
    add('gold', box, '#c4a472', [x, .045, z], [r * 2.5, .055, r * 2.5]);
    add('glow', box, '#ffe2a2', [x, .07 + h * .43, z], [r * 1.5, h * .65, r * 1.5]);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) add('gold', box, '#b99a6e', [x + dx * r, .07 + h * .43, z + dz * r], [.014, h * .78, .014]);
    add('gold', roof, '#d0b383', [x, .09 + h * .84, z], [r * 1.7, .1, r * 1.7], [0, Math.PI / 4, 0]);
    add('gold', stone, '#dec596', [x, .16 + h * .84, z], [.025, .035, .025]);
  }
  for (const source of [stone, leaf, box, post, roof]) source.dispose();
  const geometry = {} as Record<Bucket, THREE.BufferGeometry>;
  for (const key of ['matte', 'gold', 'glow'] as const) {
    geometry[key] = mergeGeometries(parts[key])!; geometry[key].computeBoundingSphere();
    parts[key].forEach(part => part.dispose());
  }
  return {
    geometry,
    matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94 }),
    gold: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .35, roughness: .5 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color().setScalar(.025), toneMapped: false }),
  };
}
export default function GardenAccents({ cake }: { cake: CakeState }) {
  const assets = useMemo(buildAccents, []), lastReveal = useRef(-1);
  useEffect(() => () => { Object.values(assets.geometry).forEach(g => g.dispose()); assets.matte.dispose(); assets.gold.dispose(); assets.glow.dispose(); }, [assets]);
  useFrame(() => {
    if (lastReveal.current === cake.reveal) return;
    lastReveal.current = cake.reveal; assets.glow.color.setScalar(.025 + cake.reveal * .975);
  });
  return <group name="garden-static-accents" dispose={null}>
    <mesh name="garden-path-and-vines" geometry={assets.geometry.matte} material={assets.matte} raycast={noRaycast} />
    <mesh name="garden-crescent-and-lanterns" geometry={assets.geometry.gold} material={assets.gold} raycast={noRaycast} />
    <mesh name="garden-lantern-glow" geometry={assets.geometry.glow} material={assets.glow} raycast={noRaycast} />
  </group>;
}

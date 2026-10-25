import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { gardenFlowerBeds as flowerBeds, gardenOutline as outline } from '../lib/gardenLayout';

const SEGMENTS = 48;
// Keep the existing character and bouquet staging area exactly at floor level.
const heightAt = (x: number, z: number) => {
  const edge = THREE.MathUtils.clamp((Math.hypot(x, z / .76) - 6.0) / 1.6, 0, 1);
  return edge * (.065 + .055 * Math.sin(x * .9 + z * .7));
};
const noRaycast = () => {};
const pebble = new THREE.SphereGeometry(1, 8, 5);
const blade = new THREE.ConeGeometry(1, 1, 3);

type Plant = { p: [number, number, number]; s: [number, number, number]; color: string; rotation?: [number, number, number] };

function makeSurface() {
  const positions: number[] = [0, 0, 0], colors: number[] = [], indices: number[] = [];
  const groundColor = (x: number, z: number) => {
    const c = new THREE.Color('#7fae88');
    const softness = .5 + .5 * Math.sin(x * .8 + z * .55);
    c.lerp(new THREE.Color('#c2d49a'), softness * .32);
    for (const bed of flowerBeds) {
      const patch = Math.max(0, 1 - Math.hypot(x - bed.x, z - bed.z) / 1.05);
      c.lerp(new THREE.Color('#709b86'), patch * .32);
    }
    return c;
  };
  colors.push(...groundColor(0, 0).toArray());
  for (const fraction of [.34, .66, 1]) for (let i = 0; i < SEGMENTS; i++) {
    const a = i / SEGMENTS * Math.PI * 2, r = outline(a) * fraction;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * .76;
    positions.push(x, heightAt(x, z), z); colors.push(...groundColor(x, z).toArray());
  }
  for (let i = 0; i < SEGMENTS; i++) {
    const next = (i + 1) % SEGMENTS;
    indices.push(0, 1 + next, 1 + i);
    for (let ring = 0; ring < 2; ring++) {
      const a = 1 + ring * SEGMENTS + i, b = 1 + ring * SEGMENTS + next;
      const c = a + SEGMENTS, d = b + SEGMENTS;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

type RockRing = { scale: number; y: number; shift?: number };
function makeStratum(rings: RockRing[], tint: string, phase: number) {
  const positions: number[] = [], colors: number[] = [];
  const sectors = phase === .3 ? SEGMENTS : 24;
  const point = (ring: RockRing, angle: number) => {
    const upperRim = phase === .3 && ring === rings[0];
    const r = outline(angle) * ring.scale * (upperRim ? 1 : 1 + .025 * Math.sin(angle * 7 + phase));
    const x = Math.cos(angle) * r + (ring.shift ?? 0), z = Math.sin(angle) * r * .76;
    return [x, upperRim ? heightAt(x, z) : ring.y + (ring.scale ? .065 * Math.sin(angle * 3 + phase) : 0), z] as [number, number, number];
  };
  for (let row = 0; row < rings.length - 1; row++) for (let i = 0; i < sectors; i++) {
    const a = i / sectors * Math.PI * 2, b = (i + 1) / sectors * Math.PI * 2;
    const corners = [point(rings[row], a), point(rings[row], b), point(rings[row + 1], a), point(rings[row + 1], b)];
    const color = new THREE.Color(tint).multiplyScalar(.92 + .085 * Math.sin(a * 2 + phase) + (row === 0 ? .06 : -.015));
    for (const index of [0, 1, 2, 1, 3, 2]) { positions.push(...corners[index]); colors.push(...color.toArray()); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

const surface = makeSurface();
const strata = [
  makeStratum([{ scale: 1, y: -.075 }, { scale: 1.015, y: -.32 }, { scale: .90, y: -.64 }], '#b19aab', .3),
  makeStratum([{ scale: .92, y: -.5 }, { scale: .86, y: -1.2, shift: .02 }, { scale: .72, y: -1.8, shift: .08 }], '#9283ad', 1.1),
  makeStratum([{ scale: .75, y: -1.62, shift: .08 }, { scale: .55, y: -2.42, shift: .16 }, { scale: .28, y: -3, shift: .3 }, { scale: 0, y: -3.35, shift: .55 }], '#656c96', 2.3),
];
const groundMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: '#52705b', emissiveIntensity: .055 });
const rockMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
const plantMaterial = new THREE.MeshStandardMaterial({ roughness: 1 });
const petalMaterial = new THREE.MeshStandardMaterial({ roughness: .95, emissive: '#ffe1ec', emissiveIntensity: .16 });
const centerMaterial = new THREE.MeshStandardMaterial({ roughness: 1, emissive: '#f7dfb0', emissiveIntensity: .2 });

function PlantBatch({ name, parts, geometry = pebble, material = plantMaterial }: { name: string; parts: Plant[]; geometry?: THREE.BufferGeometry; material?: THREE.Material }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const o = new THREE.Object3D();
    parts.forEach((part, i) => {
      o.position.set(...part.p); o.scale.set(...part.s); o.rotation.set(...(part.rotation ?? [0, 0, 0])); o.updateMatrix();
      mesh.current!.setMatrixAt(i, o.matrix); mesh.current!.setColorAt(i, new THREE.Color(part.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    const instance = mesh.current;
    return () => instance.dispose();
  }, [parts]);
  return <instancedMesh ref={mesh} name={name} args={[geometry, material, parts.length]} raycast={noRaycast} />;
}

// Authored beds, with smaller buds at their edges, rather than a ring of scatter.
const garden = (() => {
  const petals: Plant[] = [], centers: Plant[] = [], greens: Plant[] = [], blades: Plant[] = [], stones: Plant[] = [];
  const offsets = [[-.23, .04, 1], [.06, -.17, .75], [.3, .12, .9], [-.06, .3, .62], [.18, .39, 1.07], [-.32, .36, .8], [.39, -.19, .67]];
  flowerBeds.forEach((bed, bedIndex) => {
    // A handful of fallen petals nestles around each bed, never across the route.
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4 + bedIndex * .8, radius = .3 + (i % 3) * .11;
      const x = bed.x + Math.cos(a) * radius, z = bed.z + Math.sin(a) * radius * .7;
      petals.push({ p: [x, heightAt(x, z) + .023, z], s: [.046 + (i % 2) * .015, .006, .025], rotation: [0, a, .05], color: i % 2 ? bed.color : bed.accent });
    }
    for (let i = 0; i < bed.count; i++) {
      const [dx, dz, size] = offsets[i], x = bed.x + dx, z = bed.z + dz;
      const ground = heightAt(x, z), h = .16 + size * .12, spread = .056 * size;
      blades.push({ p: [x, ground + h / 2, z], s: [.009, h, .009], color: '#548c69' });
      greens.push({ p: [x + .035, ground + h * .42, z + .008], s: [.057 * size, .012, .024 * size], rotation: [0, bedIndex + i * .8, .25], color: '#83b480' });
      for (let petal = 0; petal < 5; petal++) {
        const a = petal / 5 * Math.PI * 2 + i * .6;
        petals.push({ p: [x + Math.cos(a) * spread, ground + h + .008 * Math.sin(a), z + Math.sin(a) * spread], s: [.061 * size, .021 * size, .038 * size], rotation: [0, -a, .08], color: i % 3 ? bed.color : bed.accent });
      }
      centers.push({ p: [x, ground + h + .017, z], s: [.027 * size, .021 * size, .027 * size], color: bedIndex === 1 ? '#d9ad6d' : '#e9d4a2' });
    }
  });
  const patches = [[2.75, -.35, 7], [1.35, 1.65, 6], [-1.65, 1.55, 8], [-2.55, .3, 5], [-1.3, -1.95, 9], [.45, -2.25, 6]];
  patches.forEach(([x, z, count], patch) => {
    for (let i = 0; i < count; i++) {
      const a = i * 2.4 + patch, r = .055 + (i % 4) * .065;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const h = .13 + ((i + patch) % 4) * .037;
      blades.push({ p: [px, heightAt(px, pz) + h / 2, pz], s: [.027, h, .017], rotation: [.13 * Math.cos(a), a, .18 * Math.sin(a)], color: ['#68a17e', '#94bd86', '#beca8a'][(i + patch) % 3] });
    }
  });
  [[2.8, 1.2, .22], [2.58, 1.39, .12], [-2.8, -.38, .23], [-2.56, -.15, .13], [.9, -2.35, .16]].forEach(([x, z, size], i) => stones.push({ p: [x, heightAt(x, z) + size * .18, z], s: [size, size * .4, size * .7], rotation: [0, i * .7, .1], color: i % 2 ? '#c3aaa8' : '#b4a5c6' }));
  return { petals, centers, greens, blades, stones };
})();

export default function FloatingGardenIsland() {
  return <group name="floating-garden" dispose={null}>
    <mesh name="garden-surface" geometry={surface} material={groundMaterial} receiveShadow />
    {strata.map((geometry, i) => <mesh name={`garden-rock-layer-${i}`} key={i} geometry={geometry} material={rockMaterial} />)}
    <PlantBatch name="garden-grass" parts={garden.blades} geometry={blade} />
    <PlantBatch name="garden-leaves" parts={garden.greens} />
    <PlantBatch name="garden-petals" parts={garden.petals} material={petalMaterial} />
    <PlantBatch name="garden-flower-centers" parts={garden.centers} material={centerMaterial} />
    <PlantBatch name="garden-stones" parts={garden.stones} />
  </group>;
}

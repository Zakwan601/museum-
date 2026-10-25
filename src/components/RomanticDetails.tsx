import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Placement = { position: [number, number, number]; scale?: [number, number, number]; rotation?: [number, number, number]; color?: string };
const noRaycast = () => {};
const petalGeometry = new THREE.SphereGeometry(1, 8, 6);
const bulbGeometry = new THREE.SphereGeometry(.045, 8, 6);
const candleGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
const flameGeometry = new THREE.SphereGeometry(1, 8, 6);
const petalMaterial = new THREE.MeshStandardMaterial({ roughness: .8, side: THREE.DoubleSide });
const waxMaterial = new THREE.MeshStandardMaterial({ color: '#fff0d9', roughness: .55 });
const goldMaterial = new THREE.MeshStandardMaterial({ color: '#b58d66', metalness: .65, roughness: .4 });
const glowMaterial = new THREE.MeshStandardMaterial({ color: '#fff0c5', emissive: '#ffce8c', emissiveIntensity: 2.3, toneMapped: false });

function Instances({ geometry, material, items }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    items.forEach((item, index) => {
      object.position.set(...item.position);
      object.scale.set(...(item.scale ?? [1, 1, 1]));
      object.rotation.set(...(item.rotation ?? [0, 0, 0]));
      object.updateMatrix(); ref.current!.setMatrixAt(index, object.matrix);
      if (item.color) ref.current!.setColorAt(index, new THREE.Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} raycast={noRaycast} />;
}

export default function RomanticDetails({ reducedMotion, compact, wallHeart = true, accentLights = true, palette = 'rose' }: { reducedMotion: boolean; compact: boolean; wallHeart?: boolean; accentLights?: boolean; palette?: 'rose' | 'lilac' | 'peach' }) {
  const flameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff4ce', emissive: '#ffb75d', emissiveIntensity: 2.2, toneMapped: false }), []);
  const details = useMemo(() => {
    const colors = palette === 'lilac' ? ['#b46b94', '#d49abb', '#e4bfd7', '#f2d7e2', '#c69cce'] : palette === 'peach' ? ['#c77d83', '#e7a191', '#f4c8b2', '#f8dfcc', '#dca0a2'] : ['#a93659', '#c75b7b', '#e293a8', '#f0bac5', '#d57e94'];
    const petals: Placement[] = [], candles: Placement[] = [], bases: Placement[] = [], flames: Placement[] = [], bulbs: Placement[] = [], roses: Placement[] = [];
    const cables: THREE.TubeGeometry[] = [];
    // Deterministic placements stay identical across renders and devices.
    const noise = (n: number) => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
    // Uneven handfuls and scattered singles replace the two parallel petal bands.
    const clusters = Array.from({ length: 13 }, (_, i) => ({
      x: (noise(i + 7001) - .5) * 14.8,
      z: (noise(i + 7101) - .5) * 10.6,
      spread: .35 + noise(i + 7201) * 1.05,
    }));
    for (let i = 0; i < 220; i++) {
      const cluster = clusters[Math.floor(noise(i + 101) * clusters.length)];
      const angle = noise(i + 201) * Math.PI * 2;
      const radius = Math.sqrt(noise(i + 301)) * cluster.spread;
      const clustered = noise(i + 401) < .68;
      const x = clustered ? cluster.x + Math.cos(angle) * radius : (noise(i + 501) - .5) * 16.4;
      const z = clustered ? cluster.z + Math.sin(angle) * radius : (noise(i + 601) - .5) * 11.6;
      const size = .028 + noise(i + 801) ** 1.4 * .065;
      petals.push({
        position: [x, .05 + noise(i + 901) * .006, z],
        scale: [size, .005 + noise(i + 1001) * .005, size * (.4 + noise(i + 1101) * .45)],
        rotation: [(noise(i + 1201) - .5) * .24, noise(i + 1301) * Math.PI * 2, (noise(i + 1401) - .5) * .25],
        color: colors[Math.floor(noise(i + 1501) * 5)],
      });
    }
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
      const x = side * (i < 4 ? 9.48 : 3.7 + (i - 4) * 1.5), z = i < 4 ? -4.5 + i * 3 : -6.5;
      for (let j = 0; j < 3; j++) {
        const height = .19 + j * .13, cx = x + (j - 1) * .14, cz = z + (j % 2) * .17;
        bases.push({ position: [cx, .035, cz], scale: [.105, .05, .105] });
        candles.push({ position: [cx, height / 2 + .06, cz], scale: [.07, height, .07] });
        flames.push({ position: [cx, height + .105, cz], scale: [.024, .065, .024] });
      }
    }
    for (const z of [-4.3, 0, 4.3]) {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-9.7, 4.65, z), new THREE.Vector3(-5, 4.05, z), new THREE.Vector3(0, 3.85, z), new THREE.Vector3(5, 4.05, z), new THREE.Vector3(9.7, 4.65, z)]);
      cables.push(new THREE.TubeGeometry(curve, 48, .012, 5, false));
      for (let i = 0; i <= 30; i++) {
        const p = curve.getPoint(i / 30); bulbs.push({ position: [p.x, p.y - .055, p.z] });
      }
    }
    const heartPoints = Array.from({ length: 97 }, (_, i) => {
      const t = i / 96 * Math.PI * 2;
      return new THREE.Vector3(16 * Math.sin(t) ** 3 * .135, 2.5 + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * .105, -6.63);
    });
    const heart = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(heartPoints, true), 96, .025, 6, true);
    for (let i = 0; i < 96; i += 3) {
      const p = heartPoints[i];
      // Layered petals form little rosettes on the heart's outline.
      for (let j = 0; j < 7; j++) {
        const a = j * Math.PI * 2 / 7;
        roses.push({ position: [p.x + Math.cos(a) * .06, p.y + Math.sin(a) * .06, p.z + .025], scale: [.075, .045, .04], rotation: [0, 0, a], color: i % 2 ? '#e8a4b4' : '#b95879' });
      }
    }
    return { petals, candles, bases, flames, bulbs, cables, heart, roses };
  }, [palette]);
  useEffect(() => () => { details.cables.forEach(g => g.dispose()); details.heart.dispose(); }, [details]);
  useEffect(() => () => flameMaterial.dispose(), [flameMaterial]);
  useFrame(({ clock }) => {
    flameMaterial.emissiveIntensity = reducedMotion ? 2.15 : 2.15 + Math.sin(clock.elapsedTime * 4.3) * .13 + Math.sin(clock.elapsedTime * 7.1) * .08;
  });
  return <group>
    <Instances geometry={petalGeometry} material={petalMaterial} items={details.petals} />
    {wallHeart && <Instances geometry={petalGeometry} material={petalMaterial} items={details.roses} />}
    <Instances geometry={candleGeometry} material={waxMaterial} items={details.candles} />
    <Instances geometry={candleGeometry} material={goldMaterial} items={details.bases} />
    <Instances geometry={flameGeometry} material={flameMaterial} items={details.flames} />
    <Instances geometry={bulbGeometry} material={glowMaterial} items={details.bulbs} />
    {details.cables.map((geometry, i) => <mesh key={i} geometry={geometry} material={goldMaterial} raycast={noRaycast} />)}
    {wallHeart && <mesh geometry={details.heart} material={goldMaterial} raycast={noRaycast} />}
    {accentLights && !compact && <pointLight position={[-5, .9, -5.8]} color="#ffb282" intensity={2.5} distance={7} decay={2} />}
    {accentLights && !compact && <pointLight position={[5, .9, -5.8]} color="#ffc4ad" intensity={2.5} distance={7} decay={2} />}
  </group>;
}

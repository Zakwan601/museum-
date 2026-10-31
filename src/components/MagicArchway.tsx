import ArchFlorals from './ArchFlorals';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomPortal, RoomTransitionState } from '../lib/roomTransition';
import { PASSAGE } from '../lib/museumLayout';
import { structureColors } from '../lib/galleryThemes';

const radius = PASSAGE.width / 2, spring = 2.25;
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-radius - .045, .1, 0), new THREE.Vector3(-radius - .045, spring, 0),
  ...Array.from({ length: 25 }, (_, i) => { const a = Math.PI - i / 24 * Math.PI; return new THREE.Vector3(Math.cos(a) * (radius + .045), spring + Math.sin(a) * (radius + .045), 0); }),
  new THREE.Vector3(radius + .045, .1, 0),
]);
const core = new THREE.TubeGeometry(path, 72, .024, 6, false);
const halo = new THREE.TubeGeometry(path, 72, .095, 6, false);
const opening = new THREE.Shape(); opening.moveTo(-radius, 0); opening.lineTo(radius, 0); opening.lineTo(radius, spring); opening.absarc(0, spring, radius, 0, Math.PI, false); opening.closePath();
const veilGeometry = new THREE.ShapeGeometry(opening, 28);
const noRaycast = () => {};
let sprite: THREE.CanvasTexture | undefined;
function particleSprite() {
  if (sprite) return sprite;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!, glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, '#ffffff'); glow.addColorStop(.2, '#ffffffe0'); glow.addColorStop(1, '#ffffff00');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 32, 32); sprite = new THREE.CanvasTexture(canvas); return sprite;
}

export default function MagicArchway({ portal, transition, compact, reducedMotion, simple }: { portal: RoomPortal; transition: RoomTransitionState; compact: boolean; reducedMotion: boolean; simple: boolean }) {
  const color = ['#f2d4ae', '#dfcfef', '#ffe0a3', '#e4c8f1'][portal.to];
  const main = useRef<THREE.MeshBasicMaterial>(null), aura = useRef<THREE.MeshBasicMaterial>(null), veil = useRef<THREE.MeshBasicMaterial>(null), motes = useRef<THREE.Points>(null);
  const count = compact ? 14 : 24;
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const geometry = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions, 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, 0), 5); return g; }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }, delta) => {
    const outgoing = transition.active && transition.from === portal.from && transition.to === portal.to;
    const incoming = transition.active && transition.from === portal.to && transition.to === portal.from && transition.transferred;
    const ready = transition.ready?.id === portal.id;
    const pulse = reducedMotion || simple ? 0 : Math.sin(clock.elapsedTime * 1.25) * .025;
    if (main.current) main.current.opacity = THREE.MathUtils.damp(main.current.opacity, outgoing || incoming ? 1 : ready ? .9 : .6 + pulse, 8, Math.min(delta, .1));
    if (aura.current) aura.current.opacity = outgoing || incoming ? .32 : ready ? .19 : .07;
    if (veil.current) veil.current.opacity = outgoing || incoming ? .3 : ready ? .19 : .1;
    if (!motes.current) return;
    motes.current.visible = !simple && !reducedMotion && (outgoing || incoming);
    if (!motes.current.visible) return;
    const t = incoming ? transition.elapsed - 1.25 : transition.elapsed;
    for (let i = 0; i < count; i++) {
      const seed = (i * .6180339) % 1, age = Math.max(0, t - (i % 5) * .055);
      positions[i * 3] = (seed - .5) * 3.5 + Math.sin(age * .9 + i) * .12;
      positions[i * 3 + 1] = .35 + ((i * .371) % 1) * 3.2 + age * .45;
      positions[i * 3 + 2] = .15 + age * .32 + Math.cos(i * 2.4) * .15;
    }
    geometry.attributes.position.needsUpdate = true;
    (motes.current.material as THREE.PointsMaterial).opacity = Math.min(1, t * 3) * Math.max(0, 1 - t / 1.65) * .85;
  });
  return <group name={`magic-portal-${portal.id}`} position={[portal.x - portal.direction * .19, 0, 0]} rotation={[0, portal.direction > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
    <ArchFlorals palette={portal.from} />
    <mesh geometry={halo} raycast={noRaycast}><meshBasicMaterial ref={aura} color={color} transparent opacity={.07} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
    <mesh geometry={core} raycast={noRaycast}><meshBasicMaterial ref={main} color={color} transparent opacity={.6} depthWrite={false} toneMapped={false} /></mesh>
    <mesh geometry={veilGeometry} position={[0, 0, -.01]} raycast={noRaycast}><meshBasicMaterial ref={veil} color={structureColors(['school', 'college', 'university', 'outro'][portal.to]).ceiling} transparent opacity={.1} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <points ref={motes} geometry={geometry} visible={false} raycast={noRaycast}><pointsMaterial map={particleSprite()} color={color} size={.11} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>
  </group>;
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import PhotoFrame from './PhotoFrame';
import type { PhotoConfig } from '../config';
import { ENDING_AZIMUTH, endingFrozen } from '../lib/ending';
import type { EndingState } from '../lib/ending';
import { ease } from '../lib/kiss';

const CENTER = 58.625;
const orb = new THREE.SphereGeometry(1, 12, 8);
const blade = new THREE.ConeGeometry(1, 1, 3);
const noRaycast = () => {};
const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
type Part = { p: [number, number, number]; s: [number, number, number]; color: string };
function Batch({ parts, geometry = orb, glow = false }: { parts: Part[]; geometry?: THREE.BufferGeometry; glow?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const o = new THREE.Object3D();
    parts.forEach((part, i) => { o.position.set(...part.p); o.scale.set(...part.s); o.updateMatrix(); mesh.current!.setMatrixAt(i, o.matrix); mesh.current!.setColorAt(i, new THREE.Color(part.color)); });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [parts]);
  return <instancedMesh ref={mesh} args={[geometry, undefined, parts.length]} raycast={noRaycast}>
    <meshStandardMaterial roughness={1} emissive={glow ? '#b3e9bf' : '#8f83a5'} emissiveIntensity={glow ? .45 : .12} />
  </instancedMesh>;
}
function MemoryTitle({ title }: { title: string }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 768; c.height = 128;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff4de'; ctx.textAlign = 'center'; ctx.font = '64px Gorditas, Georgia, serif'; ctx.fillText(title, 384, 88, 730);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [title]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, -.98, .02]} raycast={noRaycast}><planeGeometry args={[1.9, .4]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>;
}
export default function LittleUniverse({ ending, memories, compact, reducedMotion, simple, onPhotoClick }: { ending: EndingState; memories: PhotoConfig[]; compact: boolean; reducedMotion: boolean; simple: boolean; onPhotoClick: (photo: PhotoConfig) => void }) {
  const { scene } = useThree();
  const world = useRef<THREE.Group>(null), cards = useRef<THREE.Group>(null);
  const stars = useRef<THREE.PointsMaterial>(null), flies = useRef<THREE.Points>(null);
  const formedAt = useRef(performance.now());
  const cardRotation = useMemo(() => new THREE.Euler(-Math.atan(.29), ENDING_AZIMUTH, 0, 'YXZ'), []);
  const skyUniforms = useMemo(() => ({ top: { value: new THREE.Color('#10182e') }, bottom: { value: new THREE.Color('#655477') } }), []);
  useEffect(() => {
    const fog = scene.fog; scene.fog = null;
    return () => { scene.fog = fog; };
  }, [scene]);
  const scenery = useMemo(() => {
    const grass: Part[] = [], flowers: Part[] = [], clouds: Part[] = [], distant: Part[] = [];
    for (let i = 0; i < (compact ? 100 : 180); i++) {
      const a = seeded(i) * Math.PI * 2, r = 1.3 + seeded(i + 700) * 2.1;
      grass.push({ p: [Math.cos(a) * r, .04, Math.sin(a) * r * .76], s: [.035, .12 + seeded(i + 90) * .15, .035], color: ['#6d947b', '#88a888', '#a9b899'][i % 3] });
      if (i < 32) flowers.push({ p: [Math.cos(a) * r, .19, Math.sin(a) * r * .76], s: [.055, .035, .055], color: ['#f7d9ed', '#c8d3ff', '#fff1bd'][i % 3] });
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r = 15 + seeded(i + 200) * 19;
      for (let puff = 0; puff < 4; puff++) clouds.push({ p: [Math.cos(a) * r + (puff - 1.5) * 1.6, -4.5 - seeded(i + 400) * 4 + (puff % 2) * .6, Math.sin(a) * r + Math.sin(puff) * .6], s: [2.4 + seeded(i + puff + 500), 1.3 + seeded(i + puff + 300) * .5, 2.3], color: ['#b5accd', '#c7b6d4', '#a39ec1'][i % 3] });
    }
    for (let i = 0; i < 7; i++) distant.push({ p: [(i - 3) * 13, -7 + seeded(i + 600) * 2, -27 - seeded(i + 650) * 20], s: [5, 1.5, 3], color: '#535f78' });
    return { grass, flowers, clouds, distant };
  }, [compact]);
  const starPositions = useMemo(() => {
    const n = compact ? 400 : 680, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const az = seeded(i + 1200) * Math.PI * 2, y = seeded(i + 2200) * 1.3 - .4, r = Math.sqrt(1 - y * y); a.set([Math.cos(az) * r * 90, y * 90, Math.sin(az) * r * 90], i * 3); }
    return a;
  }, [compact]);
  const flyPositions = useMemo(() => new Float32Array(6 * 3), []);
  const placements = useMemo(() => memories.map((photo, i) => {
    const count = memories.length, extra = count > 6;
    const angle = Math.PI * .12 + i / Math.max(count, 1) * Math.PI * 2;
    const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
    const x = extra ? Math.cos(angle) * 4.25 : i === count - 1 && count % 2 ? 0 : side * 3.7;
    const y = extra ? 3.1 + Math.sin(angle) * 3.0 : i === count - 1 && count % 2 ? 5.2 : 4.1 - row * 2.5;
    const scale = extra ? .86 : 1.3;
    const position: [number, number, number] = [Math.cos(ENDING_AZIMUTH) * x, y, -Math.sin(ENDING_AZIMUTH) * x - .6];
    return { photo: { ...photo, position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: 1 }, original: photo, position, scale };
  }), [memories]);
  useFrame(({ clock }) => {
    if (world.current) { const t = reducedMotion ? 1 : ease((performance.now() - formedAt.current) / 1700); world.current.scale.setScalar(.92 + .08 * t); }
    if (cards.current) { cards.current.visible = endingFrozen(ending); cards.current.scale.setScalar(reducedMotion ? 1 : .88 + .12 * ease((performance.now() - ending.startedAt) / 4500)); }
    if (stars.current) stars.current.opacity = reducedMotion || simple ? .8 : .77 + Math.sin(clock.elapsedTime * .35) * .07;
    if (flies.current && !simple) {
      for (let i = 0; i < 6; i++) { const t = reducedMotion ? 0 : clock.elapsedTime * .13; flyPositions.set([Math.sin(i * 2.4 + t) * 3, .45 + seeded(i + 900) * 1.4 + Math.sin(i + t) * .12, Math.cos(i * 1.7 + t) * 2.4], i * 3); }
      flies.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  return <group name="our-little-universe" position={[CENTER, 0, 0]}>
    <mesh raycast={noRaycast}><sphereGeometry args={[110, 32, 16]} /><shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={skyUniforms} vertexShader={`varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={`varying vec3 vDirection; uniform vec3 top; uniform vec3 bottom; void main(){float h=smoothstep(-.75,.3,normalize(vDirection).y);vec3 color=mix(bottom,top,h);gl_FragColor=vec4(color,1.0); #include <tonemapping_fragment> #include <colorspace_fragment> }`.replace(/ #include/g, '\n#include')} /></mesh>
    <points name="universe-stars" raycast={noRaycast}><bufferGeometry><bufferAttribute attach="attributes-position" args={[starPositions, 3]} /></bufferGeometry><pointsMaterial ref={stars} color="#fff1dc" size={.23} transparent opacity={.8} depthWrite={false} sizeAttenuation /></points>
    <mesh position={[-55, 4, 14]} raycast={noRaycast}><sphereGeometry args={[2.5, 24, 16]} /><meshBasicMaterial color="#f8e4ce" /></mesh>
    <ambientLight intensity={.6} color="#dbd4ee" />
    <hemisphereLight args={['#cad8ff', '#a1a1b3', 1.4]} />
    <directionalLight position={[3, 9, 6]} intensity={1} color="#ffe4d4" />
    <group ref={world} name="floating-island">
      <mesh position={[0, -1.4, 0]} scale={[1, 1, .76]}><cylinderGeometry args={[3.55, .9, 2.6, 13, 2]} /><meshStandardMaterial color="#696373" roughness={1} flatShading /></mesh>
      <mesh position={[0, -.1, 0]} scale={[1, 1, .76]} receiveShadow><cylinderGeometry args={[3.65, 3.5, .2, 48]} /><meshStandardMaterial color="#79977b" roughness={1} /></mesh>
      <mesh position={[0, -.006, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, .76, 1]}><circleGeometry args={[2, 40]} /><meshStandardMaterial color="#92a38a" roughness={1} /></mesh>
      <Batch parts={scenery.grass} geometry={blade} /><Batch parts={scenery.flowers} glow />
    </group>
    <Batch parts={scenery.clouds} /><Batch parts={scenery.distant} />
    {!simple && <points ref={flies} name="universe-fireflies" frustumCulled={false} raycast={noRaycast}><bufferGeometry><bufferAttribute attach="attributes-position" args={[flyPositions, 3]} /></bufferGeometry><pointsMaterial color="#fff2b7" size={.055} transparent opacity={.7} depthWrite={false} /></points>}
    <group ref={cards} name="memory-constellation" visible={false}>
      {placements.map(({ photo, original, position, scale }) => <group key={original.id} name={`memory-${original.id}`} position={position} rotation={cardRotation} scale={scale}>
        <PhotoFrame photo={photo} compact reducedMotion onClick={() => { if (ending.phase === 'complete') onPhotoClick(original); }} />
        <MemoryTitle title={original.title} />
      </group>)}
    </group>
  </group>;
}

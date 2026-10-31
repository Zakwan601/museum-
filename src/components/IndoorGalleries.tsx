import type { CouchState } from '../lib/couch';
import type { CameraState } from '../controls';
import RomanticDetails from './RomanticDetails';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GALLERY_THEMES } from '../lib/galleryThemes';
import { MUSEUM_FURNITURE, MUSEUM_ROOMS } from '../lib/museumLayout';

type Part = { position: [number, number, number]; size: [number, number, number]; color: string };
const box = new THREE.BoxGeometry(1, 1, 1);
const orb = new THREE.SphereGeometry(1, 8, 6);
const matte = new THREE.MeshStandardMaterial({ roughness: .78 });
const noRaycast = () => {};

function Batch({ parts, geometry = box }: { parts: Part[]; geometry?: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    parts.forEach((p, i) => {
      object.position.set(...p.position); object.scale.set(...p.size); object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix); ref.current!.setColorAt(i, new THREE.Color(p.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [parts]);
  return <instancedMesh ref={ref} args={[geometry, matte, parts.length]} raycast={noRaycast} receiveShadow />;
}

function WallWords({ text, subtitle, position, rotation = 0, color }: { text: string; subtitle: string; position: [number, number, number]; rotation?: number; color: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.font = '46px Gorditas, serif'; ctx.fillText(text, 512, 92);
    ctx.font = '22px Gorditas, serif'; ctx.fillText(subtitle, 512, 155);
    ctx.fillRect(400, 198, 224, 2);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text, subtitle, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[0, rotation, 0]} raycast={noRaycast}>
    <planeGeometry args={[6.8, 1.7]} /><meshBasicMaterial map={texture} transparent depthWrite={false} />
  </mesh>;
}

function cushionGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.42, -.07); s.lineTo(1.42, -.07); s.quadraticCurveTo(1.5, -.07, 1.5, .01);
  s.lineTo(1.5, .09); s.quadraticCurveTo(1.5, .17, 1.42, .17);
  s.lineTo(-1.42, .17); s.quadraticCurveTo(-1.5, .17, -1.5, .09);
  s.lineTo(-1.5, .01); s.quadraticCurveTo(-1.5, -.07, -1.42, -.07);
  return new THREE.ExtrudeGeometry(s, { depth: .8, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3, curveSegments: 6, steps: 1 });
}
const cushion = cushionGeometry();
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 1.2);
heartShape.bezierCurveTo(-.9, 2.6, -2.6, 2.35, -2.6, .85);
heartShape.bezierCurveTo(-2.6, -.35, -1.1, -1.85, 0, -2.65);
heartShape.bezierCurveTo(1.1, -1.85, 2.6, -.35, 2.6, .85);
heartShape.bezierCurveTo(2.6, 2.35, .9, 2.6, 0, 1.2);
const heartRug = new THREE.ShapeGeometry(heartShape, 32);
const borderShape = new THREE.Shape(heartShape.getPoints(32));
borderShape.holes.push(new THREE.Path(heartShape.getPoints(32).map(p => p.multiplyScalar(.977)).reverse()));
const heartBorder = new THREE.ShapeGeometry(borderShape);


function GalleryInterior({ golden, active, compact, reducedMotion, couch, cameraState, onCouchStart }: { golden: boolean; active: boolean; compact: boolean; reducedMotion: boolean; couch: CouchState; cameraState: CameraState; onCouchStart: () => void }) {
  const theme = golden ? GALLERY_THEMES.university : GALLERY_THEMES.college;
  const index = golden ? 2 : 1, center = MUSEUM_ROOMS[index].centerX;
  const bench = MUSEUM_FURNITURE.find(p => p.id === (golden ? 'love-letter-table' : 'gallery-bench-0'))!;
  const decor = useMemo(() => {
    const parts: Part[] = [], wood: Part[] = [], blossoms: Part[] = [];
    const add = (position: Part['position'], size: Part['size'], color: string) => parts.push({ position, size, color });
    // Staggered boards, batched into one draw call per floor.
    for (let row = 0; row < 14; row++) for (let col = 0; col < 17; col++) {
      const left = Math.max(-9.83, -10 + col * 1.25 - (row % 2) * .625);
      const right = Math.min(9.83, -10 + (col + 1) * 1.25 - (row % 2) * .625);
      if (right <= left) continue;
      const shade = new THREE.Color(theme.floor).multiplyScalar(.86 + ((row * 7 + col * 3) % 11) * .025);
      wood.push({ position: [(left + right) / 2, .012, -6.5 + row], size: [right - left - .014, .022, .983], color: `#${shade.getHexString()}` });
    }
    for (const z of [-6.8, 6.8]) {
      add([0, .55, z], [19.6, 1.1, .1], theme.panel);
      for (const y of [.12, 1.1, 4.65]) add([0, y, z + (z < 0 ? .04 : -.04)], [19.6, y === 1.1 ? .06 : .12, .12], theme.trim);
      for (let x = -9; x <= 9; x += 1.5) add([x, .59, z + (z < 0 ? .06 : -.06)], [.035, .84, .045], theme.trim);
    }
    // Side wall panels stop before the arched passage openings.
    for (const x of [-9.8, 9.8]) for (const z of [-4.6, 4.6]) {
      add([x, .55, z], [.1, 1.1, 4.65], theme.panel);
      for (const y of [.12, 1.1, 4.65]) add([x, y, z], [.15, .075, 4.65], theme.trim);
    }
    // Leave the ceiling open for the soft, hanging fairy-light canopy.
    // Keep the existing College couch; Room 3 gets its own small letter table.
    if (!golden) {
      for (const x of [-1.3, 1.3]) for (const z of [2.85, 3.55]) add([x, .23, z], [.09, .46, .09], theme.gold);
      add([0, .78, 3.64], [3.05, .4, .1], theme.fabric);
      add([0, .95, 3.64], [3.15, .045, .14], theme.gold);
      for (const x of [-1.55, 1.55]) add([x, .69, 3.23], [.07, .12, 1], theme.gold);
    }
    // Two restrained floral arrangements, away from the main route.
    for (const x of [-7.5, 7.5]) {
      add([x, .28, -5.0], [.4, .56, .4], theme.trim);
      add([x, .62, -5.0], [.32, .15, .32], theme.gold);
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4, r = i ? .19 : 0;
        const px = x + Math.cos(a) * r, pz = -5.0 + Math.sin(a) * r;
        add([px, .84, pz], [.014, .35, .014], '#61715d');
        blossoms.push({ position: [px, 1.02 + (i % 3) * .045, pz], size: [.105, .07, .095], color: golden ? ['#f4bcaf', '#f9e1cf', '#e4a4a6'][i % 3] : ['#dba5c8', '#f0d5e1', '#c6afd6'][i % 3] });
      }
    }
    return { parts, wood, blossoms };
  }, [theme, golden]);
  const constellations = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const stars = [[-6, -3], [-4.7, -2.7], [-3.8, -1.5], [-2.5, -1.8], [-1.4, -.8], [2.5, 2.8], [3.2, 1.6], [4.9, 1.9], [5.7, .9], [6.8, 1.4]];
    stars.forEach(([x, z], i) => { if (i !== 4 && i !== 9) points.push(new THREE.Vector3(x, 4.87, z), new THREE.Vector3(stars[i + 1][0], 4.87, stars[i + 1][1])); });
    return { stars, geometry: new THREE.BufferGeometry().setFromPoints(points) };
  }, []);
  useEffect(() => () => constellations.geometry.dispose(), [constellations]);
  return <group position={[center, 0, 0]} name={golden ? 'golden-gallery' : 'midnight-gallery'}>
    <RomanticDetails compact={compact} reducedMotion={reducedMotion || !active} wallHeart={false} accentLights={false} palette={golden ? 'peach' : 'lilac'} />
    <mesh name="romantic-heart-rug" geometry={heartRug} position={[0, .044, -.95]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <meshStandardMaterial color={golden ? '#ba7778' : '#895273'} roughness={1} />
    </mesh>
    <mesh geometry={heartBorder} position={[0, .046, -.95]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}><meshStandardMaterial color={theme.gold} roughness={.8} /></mesh>
    <Batch parts={decor.wood} />
    <Batch parts={decor.parts} />
    <Batch parts={decor.blossoms} geometry={orb} />
    {golden ? <group name="love-letter-table" position={[0, 0, bench.position[2]]} userData={{ cameraObstacle: true }}>
      <mesh position={[0, .86, 0]} castShadow receiveShadow><cylinderGeometry args={[.7, .68, .09, 32]} /><meshStandardMaterial color="#f3dfd1" roughness={.7} /></mesh>
      <mesh position={[0, .883, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.685, .012, 6, 32]} /><meshStandardMaterial color={theme.gold} metalness={.35} roughness={.5} /></mesh>
      <mesh position={[0, .908, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.54, 32]} /><meshStandardMaterial color="#dca7a8" roughness={1} /></mesh>
      <mesh position={[0, .45, 0]} castShadow><cylinderGeometry args={[.09, .14, .74, 16]} /><meshStandardMaterial color="#f3dfd1" roughness={.75} /></mesh>
      <mesh position={[0, .075, 0]} scale={[1, .4, 1]}><sphereGeometry args={[.34, 20, 10]} /><meshStandardMaterial color="#f3dfd1" roughness={.75} /></mesh>
      <mesh position={[0, .11, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.27, .012, 6, 24]} /><meshStandardMaterial color={theme.gold} metalness={.35} roughness={.5} /></mesh>
    </group> : <>
    <group position={[0, 0, bench.position[2]]} userData={{ cameraObstacle: true, interactiveCouch: !golden }} name="gallery-bench" onClick={e => { if (!golden && couch.nearby && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) { e.stopPropagation(); onCouchStart(); } }}>
      <mesh geometry={cushion} position={[0, .49, -.4]} castShadow><meshStandardMaterial color={theme.fabric} emissive="#eab76c" emissiveIntensity={active ? couch.nearby ? .28 : .13 : 0} roughness={.94} /></mesh>
      <mesh position={[0, .78, .44]}><boxGeometry args={[3.05, .4, .1]} /><meshStandardMaterial color={theme.fabric} emissive="#eab76c" emissiveIntensity={active ? couch.nearby ? .28 : .13 : 0} roughness={.94} /></mesh>
    </group>
    </>}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .028, 3.2]} scale={golden ? [.6, .6, 1] : [1, .65, 1]} raycast={noRaycast}>
      <circleGeometry args={[2.1, 48]} /><meshStandardMaterial color={golden ? '#c6aa81' : '#354768'} roughness={1} />
    </mesh>
    <WallWords text={golden ? 'University Life' : 'College Days'} subtitle={golden ? 'Side by side, through every season' : 'The little moments that became us'} position={[0, 3.85, -6.77]} color={theme.trim} />
    <WallWords text={golden ? 'Our next chapter' : 'A thousand little moments'} subtitle={golden ? 'Side by side, always' : 'The days that became our story'} position={[0, 3.65, 6.77]} rotation={Math.PI} color={theme.trim} />
    {!golden && <>
      <lineSegments geometry={constellations.geometry} raycast={noRaycast}><lineBasicMaterial color="#b5c3e4" transparent opacity={.32} /></lineSegments>
      {constellations.stars.map(([x, z], i) => <mesh key={i} geometry={orb} position={[x, 4.86, z]} scale={i % 3 ? .025 : .04} raycast={noRaycast}><meshBasicMaterial color="#e8ddc6" /></mesh>)}
    </>}
    {[-4.6, 4.6].map(x => <group key={x} position={[x, 4.15, 0]}>
      <mesh><cylinderGeometry args={[.3, .4, .12, 16]} /><meshStandardMaterial color={theme.gold} roughness={.35} metalness={.5} /></mesh>
      <mesh position={[0, -.065, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.32, 20]} /><meshBasicMaterial color={golden ? '#ffe0a8' : '#e7ddff'} /></mesh>
      {active && <pointLight color={theme.light} intensity={compact ? 3 : 5} distance={11} decay={2} position={[0, -.2, 0]} />}
    </group>)}
  </group>;
}

export default function IndoorGalleries({ compact, activeRoomIndex, reducedMotion = false, couch, cameraState, onCouchStart }: { compact: boolean; activeRoomIndex: number; reducedMotion?: boolean; couch: CouchState; cameraState: CameraState; onCouchStart: () => void }) {
  return <>
    <GalleryInterior golden={false} active={activeRoomIndex === 1} compact={compact} reducedMotion={reducedMotion} couch={couch} cameraState={cameraState} onCouchStart={onCouchStart} />
    <GalleryInterior golden active={activeRoomIndex === 2} compact={compact} reducedMotion={reducedMotion} couch={couch} cameraState={cameraState} onCouchStart={onCouchStart} />
  </>;
}

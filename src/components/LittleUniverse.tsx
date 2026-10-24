import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import PhotoFrame from './PhotoFrame';
import FloatingGardenIsland from './FloatingGardenIsland';
import GardenAtmosphere from './GardenAtmosphere';
import AnniversaryCake from './AnniversaryCake';
import type { CakeState } from '../lib/cake';
import TwilightSky from './TwilightSky';
import type { PhotoConfig } from '../config';
import { endingView, endingFrozen } from '../lib/ending';
import type { EndingState } from '../lib/ending';
import { ease } from '../lib/kiss';

const CENTER = 58.625;
const noRaycast = () => {};
function MemoryTitle({ title }: { title: string }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 768; c.height = 128;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff4de'; ctx.textAlign = 'center'; ctx.font = '64px Gorditas, Georgia, serif'; ctx.fillText(title, 384, 88, 730);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [title]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, -.98, .02]} raycast={noRaycast}><planeGeometry args={[1.9, .4]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>;
}
export default function LittleUniverse({ ending, cake, memories, compact, reducedMotion, simple, onPhotoClick }: { ending: EndingState; cake: CakeState; memories: PhotoConfig[]; compact: boolean; reducedMotion: boolean; simple: boolean; onPhotoClick: (photo: PhotoConfig) => void }) {
  const { scene, size } = useThree();
  const world = useRef<THREE.Group>(null), cards = useRef<THREE.Group>(null);
  const formedAt = useRef(performance.now());
  const composition = useMemo(() => {
    const aspect = size.width / size.height;
    const view = endingView(aspect, new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(view.fov, aspect, .1, 180);
    camera.position.copy(view.position); camera.lookAt(view.target);
    camera.setViewOffset(aspect * 1000, 1000, 0, view.shiftY * 1000, aspect * 1000, 1000);
    camera.updateMatrixWorld();
    return { camera, depth: view.distance + 1.5, landscape: aspect > 1.7, shortPortrait: aspect < .8 && size.height < 650 };
  }, [size.width, size.height]);
  useEffect(() => {
    const fog = scene.fog; scene.fog = null;
    return () => { scene.fog = fog; };
  }, [scene]);
  const placements = useMemo(() => memories.map((photo, i) => {
    const { camera, depth, landscape, shortPortrait } = composition;
    const portrait = camera.aspect < .8;
    const count = memories.length;
    const lastCentered = count % 2 === 1 && i === count - 1;
    const rows = Math.ceil(count / 2);
    const row = Math.floor(i / 2);
    // Compose existing cards in the side margins, below the message and clear
    // of the couple. Use the same lens as the finale so orientation changes fit.
    const screenX = lastCentered ? .5 : i % 2 ? .84 : .16;
    const screenY = lastCentered ? (shortPortrait ? .385 : portrait ? .31 : .32) :
      (landscape ? .45 : shortPortrait ? .40 : portrait ? .36 : .38) + row * Math.min(landscape ? .27 : shortPortrait ? .11 : portrait ? .12 : .23, .43 / Math.max(1, rows - 1));
    const direction = new THREE.Vector3(screenX * 2 - 1, 1 - screenY * 2, 0).unproject(camera).sub(camera.position);
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const position = direction.multiplyScalar(depth / direction.dot(forward)).add(camera.position).toArray() as [number, number, number];
    const visibleHeight = 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const scale = visibleHeight * Math.min(.17 / 1.9, camera.aspect * .21 / 1.7, .42 / (1.9 * Math.max(2, rows))) * (lastCentered ? portrait ? .85 : .5 : 1) * (shortPortrait ? .64 : 1);
    return { photo: { ...photo, position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: 1 }, original: photo, position, scale };
  }), [memories, composition]);
  useFrame(() => {
    if (world.current) { const t = reducedMotion ? 1 : ease((performance.now() - formedAt.current) / 1700); world.current.scale.setScalar(.92 + .08 * t); }
    if (cards.current) { cards.current.visible = endingFrozen(ending); cards.current.scale.setScalar(reducedMotion ? 1 : .88 + .12 * ease((performance.now() - ending.startedAt) / 4500)); }

  });
  return <group name="our-little-universe" position={[CENTER, 0, 0]}>
    <TwilightSky compact={compact} reducedMotion={reducedMotion} simple={simple} />
    <ambientLight intensity={.6} color="#dbd4ee" />
    <hemisphereLight args={['#cad8ff', '#a1a1b3', 1.4]} />
    <directionalLight position={[3, 9, 6]} intensity={1} color="#ffe4d4" />
    <group ref={world} name="floating-island">
      <FloatingGardenIsland />
    </group>
    <AnniversaryCake cake={cake} reducedMotion={reducedMotion || simple} />
    {!simple && !reducedMotion && <GardenAtmosphere compact={compact} />}
    <group ref={cards} name="memory-constellation" visible={false}>
      {placements.map(({ photo, original, position, scale }) => <group key={original.id} name={`memory-${original.id}`} position={position} quaternion={composition.camera.quaternion} scale={scale}>
        <PhotoFrame photo={photo} compact reducedMotion onClick={() => { if (ending.phase === 'complete') onPhotoClick(original); }} />
        <MemoryTitle title={original.title} />
      </group>)}
    </group>
  </group>;
}

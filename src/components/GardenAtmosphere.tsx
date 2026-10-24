import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gardenFlowerBeds } from '../lib/gardenLayout';

const noRaycast = () => {};

// Two small batches, no lights, shadows, physics, or per-frame React state.
// All paths stay near the existing perimeter flowers, leaving the couple clear.
export default function GardenAtmosphere({ compact }: { compact: boolean }) {
  const flies = useRef<THREE.Points>(null);
  const petals = useRef<THREE.InstancedMesh>(null);
  const fireflyCount = compact ? 4 : 6;
  const petalCount = compact ? 3 : 4;
  const positions = useMemo(() => new Float32Array(fireflyCount * 3), [fireflyCount]);
  const colors = useMemo(() => new Float32Array(fireflyCount * 3), [fireflyCount]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const glow = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.2, 'rgba(255,255,255,.9)');
    gradient.addColorStop(.5, 'rgba(255,255,255,.25)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -.7); shape.quadraticCurveTo(-.8, -.1, -.45, .4);
    shape.quadraticCurveTo(0, 1, .45, .4); shape.quadraticCurveTo(.8, -.1, 0, -.7);
    return new THREE.ShapeGeometry(shape, 4);
  }, []);
  useEffect(() => () => { glow.dispose(); petalGeometry.dispose(); }, [glow, petalGeometry]);
  useEffect(() => {
    petals.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [fireflyCount, petalCount]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (flies.current) {
      for (let i = 0; i < fireflyCount; i++) {
        const bed = gardenFlowerBeds[i % gardenFlowerBeds.length], phase = i * 2.4;
        positions[i * 3] = bed.x + Math.sin(time * .17 + phase) * .24;
        positions[i * 3 + 1] = .35 + (i % 3) * .12 + Math.sin(time * .23 + phase) * .09;
        positions[i * 3 + 2] = bed.z + Math.cos(time * .14 + phase) * .22;
        const brightness = .60 + Math.sin(time * .65 + phase) * .18;
        colors[i * 3] = brightness; colors[i * 3 + 1] = brightness * .88; colors[i * 3 + 2] = brightness * .48;
      }
      flies.current.geometry.attributes.position.needsUpdate = true;
      flies.current.geometry.attributes.color.needsUpdate = true;
    }
    if (petals.current) {
      for (let i = 0; i < petalCount; i++) {
        const bed = gardenFlowerBeds[(i + 1) % gardenFlowerBeds.length], phase = i * 2.1;
        dummy.position.set(bed.x + Math.sin(time * .10 + phase) * .32,
          .62 + Math.sin(time * .13 + phase) * .24,
          bed.z + Math.cos(time * .09 + phase) * .27);
        dummy.rotation.set(.6 + Math.sin(time * .17 + phase) * .35, phase + time * .09, Math.sin(time * .15 + phase) * .45);
        dummy.scale.setScalar(.085 + (i % 3) * .012);
        dummy.updateMatrix(); petals.current.setMatrixAt(i, dummy.matrix);
      }
      petals.current.instanceMatrix.needsUpdate = true;
    }
  });

  return <group name="garden-atmosphere">
    <points ref={flies} name="universe-fireflies" frustumCulled={false} raycast={noRaycast}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial map={glow} size={.095} vertexColors transparent opacity={.72} alphaTest={.01} depthWrite={false} toneMapped={false} />
    </points>
    <instancedMesh ref={petals} name="universe-drifting-petals" args={[petalGeometry, undefined, petalCount]} frustumCulled={false} raycast={noRaycast}>
      <meshBasicMaterial color="#edbdcf" transparent opacity={.62} side={THREE.DoubleSide} forceSinglePass depthWrite={false} />
    </instancedMesh>
  </group>;
}

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOM, FLOWER_POSITIONS } from '../config';
import RomanticDetails from './RomanticDetails';
import type { ExperienceSettings } from '../hooks/useExperienceSettings';

function FlowerArrangement({ position }: { position: [number, number, number] }) {
  const flowers = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const r = 0.07;
        return {
          pos: [Math.cos(angle) * r, 1.18 + (i % 2) * 0.06, Math.sin(angle) * r] as [number, number, number],
          color: ['#c41e3a', '#e8a0a0', '#f5e6e0', '#d4456a', '#c41e3a'][i],
          scale: 0.65 + (i % 3) * 0.08,
        };
      }),
    [],
  );

  return (
    <group position={position} userData={{ cameraObstacle: true }}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.33, 0.8, 12]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.32, 0.28, 0.1, 12]} />
        <meshStandardMaterial color="#c9b896" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.25, 12]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.25} metalness={0.15} />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.pos} scale={f.scale} castShadow>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color={f.color} roughness={0.6} emissive={f.color} emissiveIntensity={0.08} />
        </mesh>
      ))}
      {flowers.map((f, i) => (
        <mesh key={`stem-${i}`} position={[f.pos[0], 1.08, f.pos[2]]}>
          <cylinderGeometry args={[0.01, 0.01, 0.15, 4]} />
          <meshStandardMaterial color="#4a6741" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function WallSconce({ position, rotation, compact }: { position: [number, number, number]; rotation: [number, number, number]; compact: boolean }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#c4a26a" roughness={0.3} metalness={0.6} emissive="#ffcc66" emissiveIntensity={0.6} />
      </mesh>
      {!compact && <pointLight intensity={0.3} distance={2.5} color="#ffe0c7" position={[0, -0.1, 0.15]} />}
    </group>
  );
}

function DustParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 150;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 4.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * 0.08;
      arr[i * 3] += Math.sin(i) * delta * 0.025;
      if (arr[i * 3 + 1] > 4.5) arr[i * 3 + 1] = 0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#ffe2b8" transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Gallery({ settings, charPos }: { settings: ExperienceSettings; charPos: THREE.Vector3 }) {
  const { width, depth } = ROOM;
  const sun = useRef<THREE.DirectionalLight>(null);
  const sunTarget = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    if (!sun.current) return;
    sun.current.position.set(charPos.x + 4, 8, charPos.z + 4);
    sunTarget.position.copy(charPos);
  });

  return (
    <>
      <primitive object={sunTarget} />
      <ambientLight intensity={0.55} color="#ffe2ed" />
      <hemisphereLight args={['#fff0ed', '#5c354f', 0.7]} />
      <pointLight position={[0, 4.5, 0]} intensity={0.5} distance={18} color="#ffe0c7" />
      <directionalLight
        ref={sun}
        target={sunTarget}
        key={settings.shadowSize}
        position={[4, 8, 4]}
        intensity={0.8}
        color="#ffe0c7"
        castShadow
        shadow-mapSize={[settings.shadowSize, settings.shadowSize]}
        shadow-bias={-.0003}
        shadow-normalBias={.025}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={30}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[1, 1.4, 1]} receiveShadow>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color="#994f72" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[1.18, 1.65, 1]}>
        <ringGeometry args={[2.46, 2.49, 64]} />
        <meshStandardMaterial color="#c4a26a" roughness={0.4} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>

      <WallSconce compact={settings.compact} position={[-width / 2 + 0.25, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <WallSconce compact={settings.compact} position={[width / 2 - 0.25, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <WallSconce compact={settings.compact} position={[0, 3.5, -depth / 2 + 0.25]} rotation={[0, 0, 0]} />

      {FLOWER_POSITIONS.map((position, i) => <FlowerArrangement key={i} position={position} />)}

      <RomanticDetails reducedMotion={settings.reducedMotion} compact={settings.compact} />
      <DustParticles reducedMotion={settings.reducedMotion} />
    </>
  );
}



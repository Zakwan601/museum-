import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraState } from '../controls';
import { LOVE_LETTER_POSITION } from '../lib/loveLetter';

export default function SecretEnvelope({ charPos, active, cameraState, reducedMotion, onNearby, onOpen }: {
  charPos: THREE.Vector3; active: boolean; cameraState: CameraState; reducedMotion: boolean;
  onNearby: (nearby: boolean) => void; onOpen: () => void;
}) {
  const near = useRef(false), glow = useRef<THREE.MeshStandardMaterial>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTap = useRef(-Infinity);
  const flap = useMemo(() => {
    const shape = new THREE.Shape(); shape.moveTo(-.33, .21); shape.lineTo(.33, .21); shape.quadraticCurveTo(.19, .08, 0, -.015); shape.quadraticCurveTo(-.19, .08, -.33, .21);
    return shape;
  }, []);
  useFrame(({ clock }) => {
    const distance = Math.hypot(charPos.x - LOVE_LETTER_POSITION[0], charPos.z - LOVE_LETTER_POSITION[2]);
    const nearby = active && distance < (near.current ? 2.05 : 1.8);
    if (nearby !== near.current) { near.current = nearby; onNearby(nearby); }
    if (glow.current) glow.current.emissiveIntensity = nearby ? (reducedMotion ? .35 : .32 + Math.sin(clock.elapsedTime * 1.5) * .08) : 0;
  });
  const open = () => {
    if (near.current && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onOpen();
  };
  return <group name="secret-love-envelope" position={LOVE_LETTER_POSITION} rotation={[.28, Math.PI, -.10]} visible={active} userData={{ interactivePhoto: true }}
    onPointerDown={e => { e.stopPropagation(); pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
    onPointerCancel={() => { pointer.current = null; }}
    onPointerUp={e => {
      e.stopPropagation(); const start = pointer.current; pointer.current = null;
      if (e.pointerType === 'touch' && start?.id === e.pointerId && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) { lastTap.current = performance.now(); open(); }
    }}
    onClick={e => { e.stopPropagation(); if (e.delta < 5 && performance.now() - lastTap.current > 500) open(); }}>
    <mesh userData={{ interactivePhoto: true }}><boxGeometry args={[.68, .44, .025]} /><meshStandardMaterial ref={glow} color="#f0dfb9" emissive="#ffc878" roughness={.9} /></mesh>
    {[-1, 1].map(side => <group key={side} rotation={[0, side < 0 ? Math.PI : 0, 0]} userData={{ interactivePhoto: true }}>
      <mesh position={[0, 0, .019]} userData={{ interactivePhoto: true }}><shapeGeometry args={[flap, 10]} /><meshStandardMaterial color="#fff0d5" roughness={.9} /></mesh>
      <mesh position={[0, -.015, .031]} rotation={[Math.PI / 2, 0, 0]} userData={{ interactivePhoto: true }}><cylinderGeometry args={[.048, .05, .012, 16]} /><meshStandardMaterial color="#b77d87" roughness={.7} /></mesh>
      <mesh position={[0, -.015, .04]} userData={{ interactivePhoto: true }}><torusGeometry args={[.032, .004, 4, 16]} /><meshStandardMaterial color="#d7b584" roughness={.65} /></mesh>
    </group>)}
  </group>;
}

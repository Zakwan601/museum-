import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraState } from '../controls';
import { LOVE_LETTER_POSITION } from '../lib/loveLetter';

export default function SecretEnvelope({ charPos, active, cameraState, reducedMotion, onNearby, onOpen }: {
  charPos: THREE.Vector3; active: boolean; cameraState: CameraState; reducedMotion: boolean;
  onNearby: (nearby: boolean) => void; onOpen: () => void;
}) {
  const near = useRef(false), glow = useRef<THREE.MeshStandardMaterial>(null), flapGlow = useRef<THREE.MeshStandardMaterial>(null), halo = useRef<THREE.MeshBasicMaterial>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTap = useRef(-Infinity);
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,.85)'); gradient.addColorStop(.45, 'rgba(255,255,255,.4)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);
  const flap = useMemo(() => {
    const shape = new THREE.Shape(); shape.moveTo(-.33, .21); shape.lineTo(.33, .21); shape.quadraticCurveTo(.19, .08, 0, -.015); shape.quadraticCurveTo(-.19, .08, -.33, .21);
    return shape;
  }, []);
  useFrame(({ clock }) => {
    const distance = Math.hypot(charPos.x - LOVE_LETTER_POSITION[0], charPos.z - LOVE_LETTER_POSITION[2]);
    const nearby = active && distance < (near.current ? 2.05 : 1.8);
    if (nearby !== near.current) { near.current = nearby; onNearby(nearby); }
    const hint = active ? THREE.MathUtils.clamp((5 - distance) / 3, 0, 1) : 0;
    const warmth = active ? .12 + hint * .5 + (nearby && !reducedMotion ? .06 * Math.sin(clock.elapsedTime * 1.5) : 0) : 0;
    if (glow.current) glow.current.emissiveIntensity = warmth;
    if (flapGlow.current) flapGlow.current.emissiveIntensity = warmth * .65;
    if (halo.current) halo.current.opacity = active ? .025 + hint * .16 : 0;
  });
  const open = () => {
    if (near.current && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onOpen();
  };
  return <group name="secret-love-envelope" position={LOVE_LETTER_POSITION} rotation={[-Math.PI / 2, 0, -.18]} visible={active} userData={{ interactivePhoto: true }}
    onPointerDown={e => { e.stopPropagation(); pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
    onPointerCancel={() => { pointer.current = null; }}
    onPointerUp={e => {
      e.stopPropagation(); const start = pointer.current; pointer.current = null;
      if (e.pointerType === 'touch' && start?.id === e.pointerId && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) { lastTap.current = performance.now(); open(); }
    }}
    onClick={e => { e.stopPropagation(); if (e.delta < 5 && performance.now() - lastTap.current > 500) open(); }}>
    <mesh position={[0, 0, -.013]} raycast={() => {}}><planeGeometry args={[1.05, .8]} /><meshBasicMaterial ref={halo} map={glowTexture} color="#ffd691" transparent opacity={0} depthWrite={false} /></mesh>
    <mesh userData={{ interactivePhoto: true }}><boxGeometry args={[.68, .44, .025]} /><meshStandardMaterial ref={glow} color="#f0dfb9" emissive="#ffc878" roughness={.9} /></mesh>
    {[-1, 1].map(side => <group key={side} rotation={[0, side < 0 ? Math.PI : 0, 0]} userData={{ interactivePhoto: true }}>
      <mesh position={[0, 0, .019]} userData={{ interactivePhoto: true }}><shapeGeometry args={[flap, 10]} /><meshStandardMaterial ref={side === 1 ? flapGlow : undefined} color="#fff0d5" emissive="#ffcd85" roughness={.9} /></mesh>
      <mesh position={[0, -.015, .031]} rotation={[Math.PI / 2, 0, 0]} userData={{ interactivePhoto: true }}><cylinderGeometry args={[.048, .05, .012, 16]} /><meshStandardMaterial color="#b77d87" roughness={.7} /></mesh>
      <mesh position={[0, -.015, .04]} userData={{ interactivePhoto: true }}><torusGeometry args={[.032, .004, 4, 16]} /><meshStandardMaterial color="#d7b584" roughness={.65} /></mesh>
    </group>)}
  </group>;
}

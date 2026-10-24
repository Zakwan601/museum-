import * as THREE from 'three';
import { GARDEN_CENTER_X } from './gardenLayout';

export type CakePhase = 'hidden' | 'revealing' | 'walking' | 'inviting' | 'positioning' | 'lighting' | 'wish' | 'blowing' | 'finished' | 'kissPause' | 'aligning' | 'kissing' | 'constellation' | 'heartHold';
export const CAKE = {
  position: new THREE.Vector3(GARDEN_CENTER_X - .35, 0, -4.6),
  npcPosition: new THREE.Vector3(GARDEN_CENTER_X - 1.5, 0, -3.8),
  collisionRadius: 1.0, interactionRange: 1.55, revealSeconds: 2.4,
};
export const createCakeState = () => ({
  phase: 'hidden' as CakePhase, elapsed: 0, reveal: 0,
  npcArrived: false, nearby: false, acknowledged: false,
  positioned: false, lit: 0, flame: 0, eyesClosed: 0, canBlow: false, alignmentReady: false, alignmentStage: 0, alignmentPlanned: false,
  alignmentTarget: new THREE.Vector3(), heartProgress: 0,
});
export type CakeState = ReturnType<typeof createCakeState>;
export const cakeControlsReady = (cake: CakeState) => cake.phase === 'inviting';
export const cakeUi = (cake: CakeState) => ({ phase: cake.phase, nearby: cake.nearby, acknowledged: cake.acknowledged, canBlow: cake.canBlow });
// Shared by girl and NPC: the pedestal remains solid before it is discovered.
export function constrainCakePosition(position: { x: number; z: number }) {
  const dx = position.x - CAKE.position.x, dz = position.z - CAKE.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < CAKE.collisionRadius) {
    const angle = distance > .0001 ? Math.atan2(dx, dz) : Math.PI / 2;
    position.x = CAKE.position.x + Math.sin(angle) * CAKE.collisionRadius;
    position.z = CAKE.position.z + Math.cos(angle) * CAKE.collisionRadius;
  }
}

export const cakeCeremonyActive = (cake: CakeState) => ['positioning', 'lighting', 'wish', 'blowing', 'kissPause', 'aligning', 'kissing', 'constellation', 'heartHold'].includes(cake.phase);
export function startCakeCeremony(cake: CakeState) {
  if (cake.phase !== 'inviting' || !cake.nearby) return false;
  cake.phase = 'positioning'; cake.elapsed = 0; cake.nearby = false; cake.acknowledged = true;
  return true;
}
export function blowCakeCandles(cake: CakeState) {
  if (cake.phase !== 'wish' || !cake.canBlow) return false;
  cake.phase = 'blowing'; cake.elapsed = 0; cake.canBlow = false;
  return true;
}

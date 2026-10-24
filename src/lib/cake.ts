import * as THREE from 'three';
import { GARDEN_CENTER_X } from './gardenLayout';

export type CakePhase = 'hidden' | 'revealing' | 'walking' | 'inviting';
export const CAKE = {
  position: new THREE.Vector3(GARDEN_CENTER_X - .35, 0, -4.6),
  npcPosition: new THREE.Vector3(GARDEN_CENTER_X - 1.5, 0, -3.8),
  collisionRadius: 1.0, interactionRange: 1.55, revealSeconds: 2.4,
};
export const createCakeState = () => ({
  phase: 'hidden' as CakePhase, elapsed: 0, reveal: 0,
  npcArrived: false, nearby: false, acknowledged: false,
});
export type CakeState = ReturnType<typeof createCakeState>;
export const cakeControlsReady = (cake: CakeState) => cake.phase === 'inviting';
export const cakeUi = (cake: CakeState) => ({ phase: cake.phase, nearby: cake.nearby, acknowledged: cake.acknowledged });
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

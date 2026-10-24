import * as THREE from 'three';
import { ease } from './kiss';

export const MOMENT_PASSING_DISTANCE = 1.18;
export const createMomentPath = () => ({
  startCenter: new THREE.Vector3(), endCenter: new THREE.Vector3(),
  startAngle: 0, turn: 0, startDistance: 0, endDistance: 0, passingDistance: 0,
});
export type MomentPath = ReturnType<typeof createMomentPath>;

export function planMomentPath(path: MomentPath, player: THREE.Vector3, partner: THREE.Vector3, center: THREE.Vector3, axis: THREE.Vector3, endDistance: number) {
  path.startCenter.copy(player).add(partner).multiplyScalar(.5);
  path.endCenter.copy(center);
  const dx = partner.x - player.x, dz = partner.z - player.z;
  path.startDistance = Math.hypot(dx, dz);
  path.startAngle = path.startDistance > .0001 ? Math.atan2(dx, dz) : Math.atan2(axis.x, axis.z);
  path.turn = THREE.MathUtils.euclideanModulo(Math.atan2(axis.x, axis.z) - path.startAngle + Math.PI, Math.PI * 2) - Math.PI;
  path.endDistance = endDistance;
  path.passingDistance = Math.max(MOMENT_PASSING_DISTANCE, path.startDistance, endDistance);
}

// First make space, then travel/turn as a pair, then close the remaining gap.
// Reversing progress retraces the same arcs, including from a held photo pose.
// This stays allocation-free in the animation loop.
export function momentFacing(progress: number) { return ease((progress - .18) / .52); }
export function sampleMomentPosition(path: MomentPath, progress: number, side: number, out: THREE.Vector3) {
  const align = momentFacing(progress);
  const openDistance = THREE.MathUtils.lerp(path.startDistance, path.passingDistance, ease(progress / .18));
  const distance = THREE.MathUtils.lerp(openDistance, path.endDistance, ease((progress - .70) / .30));
  const angle = path.startAngle + path.turn * align;
  out.lerpVectors(path.startCenter, path.endCenter, align);
  out.x += Math.sin(angle) * distance * side / 2;
  out.z += Math.cos(angle) * distance * side / 2;
  return out;
}

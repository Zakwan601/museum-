import * as THREE from 'three';
import type { PhotoConfig } from '../config';
export type EndingPhase = 'exploring' | 'arrival' | 'bouquet' | 'pullback' | 'complete';
export interface EndingState {
  phase: EndingPhase;
  startedAt: number;
  cameraCaptured: boolean;
  cameraPosition: THREE.Vector3;
  cameraRotation: THREE.Quaternion;
  cameraFov: number;
}
export const createEnding = (): EndingState => ({ phase: 'exploring', startedAt: 0, cameraCaptured: false, cameraPosition: new THREE.Vector3(), cameraRotation: new THREE.Quaternion(), cameraFov: 55 });
export const endingFrozen = (ending: EndingState) => ending.phase === 'pullback' || ending.phase === 'complete';
// Several galleries currently reuse sample memories. Keep one card per actual memory.
export const memoryKey = (photo: PhotoConfig) => [photo.url, photo.title, photo.caption, photo.date].join('|');
export const ENDING_PULLBACK_SECONDS = 6;
export const ENDING_AZIMUTH = Math.PI / 2;
export function endingView(aspect: number, center: THREE.Vector3) {
  const fov = 55;
  const distance = Math.max(15, 12.4 / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect));
  const target = center.clone().setY(3.5);
  return { fov, target, position: target.clone().add(new THREE.Vector3(Math.sin(ENDING_AZIMUTH), .29, Math.cos(ENDING_AZIMUTH)).normalize().multiplyScalar(distance)) };
}

import * as THREE from 'three';
import type { PhotoConfig } from '../config';
export type EndingPhase = 'exploring' | 'arrival' | 'bouquet' | 'cake' | 'pullback' | 'complete';
export interface EndingState {
  phase: EndingPhase;
  startedAt: number;
  cameraCaptured: boolean;
  center: THREE.Vector3;
  azimuth: number;
  cameraPosition: THREE.Vector3;
  cameraRotation: THREE.Quaternion;
  cameraFov: number;
}
export const createEnding = (): EndingState => ({ phase: 'exploring', startedAt: 0, cameraCaptured: false, azimuth: Math.PI / 2 - .25, center: new THREE.Vector3(58.625, 0, 0), cameraPosition: new THREE.Vector3(), cameraRotation: new THREE.Quaternion(), cameraFov: 55 });
export const endingFrozen = (ending: EndingState) => ending.phase === 'pullback' || ending.phase === 'complete';
// Several galleries currently reuse sample memories. Keep one card per actual memory.
export const memoryKey = (photo: PhotoConfig) => [photo.url, photo.title, photo.caption, photo.date].join('|');
export const ENDING_PULLBACK_SECONDS = 6;
// A gentle three-quarter view keeps both faces and the forward-held bouquet visible.
export const ENDING_AZIMUTH = Math.PI / 2 - .25;
export function endingView(aspect: number, center: THREE.Vector3, azimuth = ENDING_AZIMUTH) {
  const fov = 48;
  // Fit the island, rather than the old wide constellation. Narrow phones need
  // horizontal breathing room; desktop and landscape keep an intimate distance.
  const distance = Math.max(10.2, 6.4 / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect));
  const target = center.clone().setY(0);
  return {
    fov, target, distance, shiftY: -.10,
    position: target.clone().add(new THREE.Vector3(Math.sin(azimuth), .30, Math.cos(azimuth)).normalize().multiplyScalar(distance)),
  };
}

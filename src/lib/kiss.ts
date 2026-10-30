import * as THREE from 'three';
export const KISS_DURATION = 8.2;
// Finish just after the handoff and a short reaction, without a trailing idle hold.
export const BOUQUET_DURATION = 6.4;
export interface KissState {
  active: boolean;
  pairDistance: number;
  sequence: number;
  elapsed: number;
  mode: 'kiss' | 'photo' | 'bouquet' | 'hug' | 'flower';
  bouquetReceived: boolean;
  flowerReceived: boolean;
  flowerAzimuth: number;
  returning: boolean;
  center: THREE.Vector3;
  axis: THREE.Vector3;
}
export const createKissState = (): KissState => ({ active: false, pairDistance: 1.1, sequence: 0, elapsed: 0, mode: 'kiss', bouquetReceived: false, flowerReceived: false, flowerAzimuth: 0, returning: false, center: new THREE.Vector3(), axis: new THREE.Vector3(1, 0, 0) });
export const ease = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

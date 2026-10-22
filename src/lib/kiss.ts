import * as THREE from 'three';
export const KISS_DURATION = 8.2;
export interface KissState {
  active: boolean;
  sequence: number;
  elapsed: number;
  mode: 'kiss' | 'photo';
  returning: boolean;
  center: THREE.Vector3;
  axis: THREE.Vector3;
}
export const createKissState = (): KissState => ({ active: false, sequence: 0, elapsed: 0, mode: 'kiss', returning: false, center: new THREE.Vector3(), axis: new THREE.Vector3(1, 0, 0) });
export const ease = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

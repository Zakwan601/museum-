import * as THREE from 'three';

export interface BouquetPose { position: THREE.Vector3; rotation: THREE.Quaternion; visible: boolean }
export const createBouquetPose = (): BouquetPose => ({ position: new THREE.Vector3(), rotation: new THREE.Quaternion(), visible: false });
export interface GiftGrip { side?: -1 | 1; amount: number; hands: [THREE.Vector3, THREE.Vector3] }
export const createGiftGrip = (): GiftGrip => ({ amount: 0, hands: [new THREE.Vector3(), new THREE.Vector3()] });

import * as THREE from 'three';
export const FLOWER_DURATION = 6.6;
export const createEarFlower = () => ({ visible: false, attached: false, amount: 0, side: -1 as -1 | 1, position: new THREE.Vector3(), anchor: new THREE.Vector3(), rotation: new THREE.Quaternion(), anchorRotation: new THREE.Quaternion() });
export type EarFlowerPose = ReturnType<typeof createEarFlower>;
export const createFlowerReach = () => ({ amount: 0, side: 1 as -1 | 1, target: new THREE.Vector3() });
export type FlowerReach = ReturnType<typeof createFlowerReach>;

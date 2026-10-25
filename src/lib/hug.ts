import * as THREE from 'three';

export const HUG_DURATION = 7.2;
export const hugLean = (gap: number) => Math.asin(THREE.MathUtils.clamp((gap - .12) / 1.48, .3, Math.sin(.76)));
export const createHugPose = () => ({ amount: 0, gap: 1, hands: [new THREE.Vector3(), new THREE.Vector3()] as [THREE.Vector3, THREE.Vector3] });
export type HugPose = ReturnType<typeof createHugPose>;

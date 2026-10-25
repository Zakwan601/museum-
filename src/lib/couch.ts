import * as THREE from 'three';
import { MUSEUM_FURNITURE } from './museumLayout';
const furniture = MUSEUM_FURNITURE.find(f => f.id === 'gallery-bench-0')!;
// Measured cushion top: .695; add .11 for the rounded thigh/hip center.
// The knee/heel must clear the cushion's beveled front edge at z = 2.765.
export const COUCH = { x: furniture.position[0], z: furniture.position[2], seatZ: furniture.position[2] - .38, hipY: .805, seconds: .9 };
export const createCouchState = () => ({ phase: 'idle' as 'idle' | 'entering' | 'seated' | 'leaving', elapsed: 0, nearby: false, sequence: 0, completed: false, cancelled: false });
export type CouchState = ReturnType<typeof createCouchState>;
export const couchUi = (c: CouchState) => ({ phase: c.phase, nearby: c.nearby });
export const createSittingPose = () => ({ amount: 0, holding: false, hand: new THREE.Vector3() });
export type SittingPose = ReturnType<typeof createSittingPose>;
export function startCouch(c: CouchState) { if (c.phase !== 'idle' || !c.nearby) return false; c.phase = 'entering'; c.elapsed = 0; c.completed = false; c.sequence++; return true; }
export function leaveCouch(c: CouchState) { if (c.phase !== 'seated') return false; c.phase = 'leaving'; c.elapsed = 0; c.completed = false; return true; }

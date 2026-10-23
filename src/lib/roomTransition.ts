import { ROOM } from '../config';
import { MUSEUM_ROOMS } from './museumLayout';

export const ROOM_TRANSITION_DURATION = 2.6;
export interface RoomPortal { id: string; from: number; to: number; direction: -1 | 1; x: number }
export const ROOM_PORTALS: RoomPortal[] = MUSEUM_ROOMS.flatMap(room => [-1, 1].flatMap(side => {
  const to = room.index + side;
  return to < 0 || to >= MUSEUM_ROOMS.length ? [] : [{ id: `${room.id}-${side}`, from: room.index, to, direction: side as -1 | 1, x: room.centerX + side * ROOM.width / 2 }];
}));
export interface RoomTransitionState {
  active: boolean; elapsed: number; startedAt: number; sequence: number; relocation: number; transferred: boolean;
  from: number; to: number; direction: -1 | 1; ready: RoomPortal | null; cooldown: number;
  overlay: HTMLDivElement | null;
}
export const createRoomTransition = (): RoomTransitionState => ({ active: false, elapsed: 0, startedAt: 0, sequence: 0, relocation: 0, transferred: false, from: 0, to: 0, direction: 1, ready: null, cooldown: 0, overlay: null });

import { CHARACTER, ROOM } from '../config';
import { BOOKSHELF } from './books';

export const PASSAGE = { length: 2, width: 4.2 };
export const MUSEUM_ROOMS = ['School Days', 'College Days', 'University Life', 'Future'].map((name, index) => ({
  id: ['school', 'college', 'university', 'outro'][index], name, index, centerX: index * (ROOM.width + PASSAGE.length),
}));
export type MuseumRoom = (typeof MUSEUM_ROOMS)[number];
export const MUSEUM_BOUNDS = { minX: -ROOM.width / 2, maxX: MUSEUM_ROOMS[3].centerX + ROOM.width / 2, minZ: -ROOM.depth / 2, maxZ: ROOM.depth / 2 };
export interface MuseumWall { id: string; position: [number, number, number]; size: [number, number, number] }
// Low furniture stays outside the central doorway-to-doorway walking route.
export const MUSEUM_FURNITURE: MuseumWall[] = [22, 44].flatMap((x, i) => [
  { id: `gallery-bench-${i}`, position: [x, .44, 3.2] as [number, number, number], size: [3.2, .88, 1.05] as [number, number, number] },
  ...[-1, 1].map(side => ({ id: `gallery-flowers-${i}-${side}`, position: [x + side * 7.5, .55, -5.0] as [number, number, number], size: [.6, 1.1, .6] as [number, number, number] })),
]);

MUSEUM_FURNITURE.push({ id: 'school-bookshelf', position: [BOOKSHELF.position[0], 1.7, BOOKSHELF.position[2]], size: [4.2, 3.4, .74] });

// The rendered walls and collision boxes come from one layout.
export const MUSEUM_WALLS: MuseumWall[] = [];
const wall = (id: string, x: number, z: number, width: number, depth: number) => {
  MUSEUM_WALLS.push({ id, position: [x, ROOM.height / 2, z], size: [width, ROOM.height, depth] });
};
for (const room of MUSEUM_ROOMS) {
  for (const side of [-1, 1]) {
    wall(`${room.id}-end-${side}`, room.centerX, side * ROOM.depth / 2, ROOM.width, ROOM.wallThickness);
    const hasDoor = side === -1 ? room.index > 0 : room.index < MUSEUM_ROOMS.length - 1;
    const x = room.centerX + side * ROOM.width / 2;
    if (hasDoor) {
      const length = (ROOM.depth - PASSAGE.width) / 2;
      for (const section of [-1, 1]) wall(`${room.id}-door-${side}-${section}`, x, section * (PASSAGE.width / 2 + length / 2), ROOM.wallThickness, length);
    } else wall(`${room.id}-outer-${side}`, x, 0, ROOM.wallThickness, ROOM.depth);
  }
  if (room.index < MUSEUM_ROOMS.length - 1) {
    const x = room.centerX + ROOM.width / 2 + PASSAGE.length / 2;
    for (const side of [-1, 1]) wall(`${room.id}-passage-${side}`, x, side * PASSAGE.width / 2, PASSAGE.length, ROOM.wallThickness);
  }
}
const collisionSolids = [...MUSEUM_WALLS, ...MUSEUM_FURNITURE];
export function museumRoomAt(x: number): MuseumRoom {
  const index = Math.max(0, Math.min(MUSEUM_ROOMS.length - 1, Math.round(x / (ROOM.width + PASSAGE.length))));
  return MUSEUM_ROOMS[index];
}

export function constrainMuseumPosition(position: { x: number; z: number }, radius = CHARACTER.radius + .25) {
  const padding = ROOM.wallThickness / 2 + radius;
  position.x = Math.max(MUSEUM_BOUNDS.minX + padding, Math.min(MUSEUM_BOUNDS.maxX - padding, position.x));
  position.z = Math.max(MUSEUM_BOUNDS.minZ + padding, Math.min(MUSEUM_BOUNDS.maxZ - padding, position.z));
  for (let i = 0; i < MUSEUM_ROOMS.length - 1; i++) {
    const room = MUSEUM_ROOMS[i];
    const edge = room.centerX + ROOM.width / 2;
    if (position.x > edge && position.x < edge + PASSAGE.length) {
      const side = PASSAGE.width / 2 - ROOM.wallThickness / 2 - radius;
      position.z = Math.max(-side, Math.min(side, position.z));
    }
  }
  // Multiple passes settle the circle at adjoining doorway and corridor corners.
  for (let pass = 0; pass < 3; pass++) for (const box of collisionSolids) {
    const minX = box.position[0] - box.size[0] / 2, maxX = box.position[0] + box.size[0] / 2;
    const minZ = box.position[2] - box.size[2] / 2, maxZ = box.position[2] + box.size[2] / 2;
    const nearestX = Math.max(minX, Math.min(maxX, position.x)), nearestZ = Math.max(minZ, Math.min(maxZ, position.z));
    const dx = position.x - nearestX, dz = position.z - nearestZ, distance = Math.hypot(dx, dz);
    if (distance >= radius) continue;
    if (distance > .00001) {
      position.x += dx / distance * (radius - distance);
      position.z += dz / distance * (radius - distance);
    } else {
      const exits = [position.x - minX + radius, maxX - position.x + radius, position.z - minZ + radius, maxZ - position.z + radius];
      const exit = exits.indexOf(Math.min(...exits));
      if (exit === 0) position.x = minX - radius;
      if (exit === 1) position.x = maxX + radius;
      if (exit === 2) position.z = minZ - radius;
      if (exit === 3) position.z = maxZ + radius;
    }
  }
}

// Distance along a horizontal camera ray before reaching any solid wall.
export function cameraWallDistance(origin: { x: number; z: number }, x: number, z: number, limit: number, padding = .28) {
  let distance = limit;
  for (const box of MUSEUM_WALLS) {
    let enter = 0, leave = limit;
    const minX = box.position[0] - box.size[0] / 2 - padding, maxX = box.position[0] + box.size[0] / 2 + padding;
    const minZ = box.position[2] - box.size[2] / 2 - padding, maxZ = box.position[2] + box.size[2] / 2 + padding;
    if (Math.abs(x) < .00001) {
      if (origin.x < minX || origin.x > maxX) continue;
    } else {
      const a = (minX - origin.x) / x, b = (maxX - origin.x) / x;
      enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
    }
    if (Math.abs(z) < .00001) {
      if (origin.z < minZ || origin.z > maxZ) continue;
    } else {
      const a = (minZ - origin.z) / z, b = (maxZ - origin.z) / z;
      enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
    }
    if (leave >= enter && leave >= 0) distance = Math.min(distance, Math.max(.1, enter));
  }
  return distance;
}

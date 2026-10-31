import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ROOM } from '../config';
import { MUSEUM_ROOMS, MUSEUM_WALLS, PASSAGE } from '../lib/museumLayout';
import { structureColors } from '../lib/galleryThemes';

function DoorLabel({ name, x, direction }: { name: string; x: number; direction: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 640, 96);
    ctx.fillStyle = '#f7e9ec'; ctx.font = '30px Gorditas, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name, 320, 48);
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; return result;
  }, [name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[x, 4.7, 0]} rotation={[0, direction > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
    <planeGeometry args={[3.15, .34]} /><meshBasicMaterial map={texture} transparent depthWrite={false} />
  </mesh>;
}
const radius = PASSAGE.width / 2, spring = 2.25;
const spandrel = new THREE.Shape();
spandrel.moveTo(-radius, ROOM.height); spandrel.lineTo(radius, ROOM.height);
spandrel.lineTo(radius, spring); spandrel.absarc(0, spring, radius, 0, Math.PI, false); spandrel.closePath();
const archWall = new THREE.ExtrudeGeometry(spandrel, { depth: ROOM.wallThickness, bevelEnabled: false, curveSegments: 32 });
const band = new THREE.Shape();
band.absarc(0, spring, radius + .13, 0, Math.PI, false);
band.lineTo(-radius, spring); band.absarc(0, spring, radius, Math.PI, 0, true); band.closePath();
const archTrim = new THREE.ShapeGeometry(band, 32);
function ArchedDoor({ x, roomId }: { x: number; roomId: string }) {
  const colors = structureColors(roomId);
  return <group name="arched-door" position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
    <mesh geometry={archWall} position={[0, 0, -ROOM.wallThickness / 2]} userData={{ cameraObstacle: true }}>
      <meshStandardMaterial color={colors.wall} roughness={.92} />
    </mesh>
    {[-1, 1].map(face => <group key={face} position={[0, 0, face * .167]}>
      <mesh geometry={archTrim}><meshStandardMaterial color={colors.gold} metalness={.4} roughness={.48} side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * (radius + .065), spring / 2, 0]}>
        <boxGeometry args={[.13, spring, .035]} /><meshStandardMaterial color={colors.gold} metalness={.4} roughness={.48} />
      </mesh>)}
    </group>)}
  </group>;
}
export default function RoomStructure() {
  return <group name="museum-structure">
    {MUSEUM_ROOMS.slice(0, 3).map(room => <group key={room.id} name={`room-${room.id}`} position={[room.centerX, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ROOM.width, ROOM.depth]} /><meshStandardMaterial color={structureColors(room.id).floor} roughness={.8} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}><planeGeometry args={[ROOM.width, ROOM.depth]} /><meshStandardMaterial color={structureColors(room.id).ceiling} side={THREE.DoubleSide} /></mesh>
    </group>)}
    {MUSEUM_ROOMS.slice(0, -1).map(room => <group key={room.id} position={[room.centerX + ROOM.width / 2 + PASSAGE.length / 2, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[PASSAGE.length, PASSAGE.width]} /><meshStandardMaterial color="#777078" roughness={.8} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}><planeGeometry args={[PASSAGE.length, PASSAGE.width]} /><meshStandardMaterial color="#a49ba4" side={THREE.DoubleSide} /></mesh>
    </group>)}
    {MUSEUM_WALLS.map(wall => <mesh key={wall.id} name={wall.id} position={wall.position} userData={{ cameraObstacle: true }} receiveShadow>
      <boxGeometry args={wall.size} /><meshStandardMaterial color={structureColors(wall.id).wall} roughness={.92} />
    </mesh>)}
    {MUSEUM_ROOMS.slice(0, 3).map(room => <group key={`signs-${room.id}`}>
      {room.index < MUSEUM_ROOMS.length - 1 && <ArchedDoor x={room.centerX + ROOM.width / 2} roomId={room.id} />}
      {room.index > 0 && <ArchedDoor x={room.centerX - ROOM.width / 2} roomId={room.id} />}
      {room.index < MUSEUM_ROOMS.length - 1 && <DoorLabel name={MUSEUM_ROOMS[room.index + 1].name} x={room.centerX + ROOM.width / 2 - .18} direction={1} />}
      {room.index > 0 && <DoorLabel name={MUSEUM_ROOMS[room.index - 1].name} x={room.centerX - ROOM.width / 2 + .18} direction={-1} />}
    </group>)}
  </group>;
}

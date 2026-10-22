import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ROOM } from '../config';
import { MUSEUM_ROOMS, MUSEUM_WALLS, PASSAGE } from '../lib/museumLayout';

function DoorLabel({ name, x, direction }: { name: string; x: number; direction: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#302631'; ctx.fillRect(0, 0, 640, 96);
    ctx.fillStyle = '#f7e9ec'; ctx.font = '32px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${direction > 0 ? 'Next: ' : 'Back: '}${name}`, 320, 48);
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; return result;
  }, [name, direction]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[x, 3.65, 0]} rotation={[0, direction > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
    <planeGeometry args={[3.3, .5]} /><meshBasicMaterial map={texture} />
  </mesh>;
}
export default function RoomStructure() {
  return <group name="museum-structure">
    {MUSEUM_ROOMS.map(room => <group key={room.id} name={`room-${room.id}`} position={[room.centerX, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ROOM.width, ROOM.depth]} /><meshStandardMaterial color={room.index === 0 ? '#765660' : '#777078'} roughness={.8} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}><planeGeometry args={[ROOM.width, ROOM.depth]} /><meshStandardMaterial color={room.index === 0 ? '#8b667b' : '#a49ba4'} side={THREE.DoubleSide} /></mesh>
    </group>)}
    {MUSEUM_ROOMS.slice(0, -1).map(room => <group key={room.id} position={[room.centerX + ROOM.width / 2 + PASSAGE.length / 2, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[PASSAGE.length, PASSAGE.width]} /><meshStandardMaterial color="#777078" roughness={.8} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}><planeGeometry args={[PASSAGE.length, PASSAGE.width]} /><meshStandardMaterial color="#a49ba4" side={THREE.DoubleSide} /></mesh>
    </group>)}
    {MUSEUM_WALLS.map(wall => <mesh key={wall.id} name={wall.id} position={wall.position} userData={{ cameraObstacle: true }} receiveShadow>
      <boxGeometry args={wall.size} /><meshStandardMaterial color={wall.id.startsWith('school-') ? '#dbb5c4' : '#c6bfc7'} roughness={.92} />
    </mesh>)}
    {MUSEUM_ROOMS.map(room => <group key={`signs-${room.id}`}>
      {room.index < MUSEUM_ROOMS.length - 1 && <DoorLabel name={MUSEUM_ROOMS[room.index + 1].name} x={room.centerX + ROOM.width / 2 - .18} direction={1} />}
      {room.index > 0 && <DoorLabel name={MUSEUM_ROOMS[room.index - 1].name} x={room.centerX - ROOM.width / 2 + .18} direction={-1} />}
    </group>)}
  </group>;
}

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BOOKS, BOOKSHELF } from '../lib/books';
import type { BookConfig } from '../lib/books';

const noRaycast = () => {};
const wood = new THREE.MeshStandardMaterial({ color: '#775043', roughness: .72 });
const walnut = new THREE.MeshStandardMaterial({ color: '#4f3430', roughness: .86 });
const gold = new THREE.MeshStandardMaterial({ color: '#c5a572', metalness: .5, roughness: .45 });
const pages = new THREE.MeshStandardMaterial({ color: '#eee1c9', roughness: .95 });
const covers = ['#c99452', '#d6b95d', '#42677b', '#b18339', '#5c6c67', '#777767'];

function ShelfBook({ book, index, nearby, loadCover, onOpen }: { book: BookConfig; index: number; nearby: boolean; loadCover: boolean; onOpen: (book: BookConfig) => void }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTap = useRef(-Infinity);
  useEffect(() => {
    if (!loadCover) return;
    let disposed = false, loaded: THREE.Texture | undefined;
    new THREE.TextureLoader().load(book.thumbnail, value => {
      if (disposed) { value.dispose(); return; }
      value.colorSpace = THREE.SRGBColorSpace; value.anisotropy = 2;
      loaded = value; setTexture(value);
    }, undefined, () => { /* Leave a plain binding if a cover cannot load; never fake artwork. */ });
    return () => { disposed = true; loaded?.dispose(); };
  }, [book.thumbnail, loadCover]);
  const open = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (performance.now() - lastTap.current > 500) onOpen(book); };
  return <group name={book.id} position={book.shelfPosition} userData={{ interactivePhoto: true }}
    onPointerDown={e => { e.stopPropagation(); if (e.pointerType === 'touch') touch.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
    onPointerCancel={() => { touch.current = null; }}
    onPointerUp={e => {
      e.stopPropagation(); const start = touch.current; touch.current = null;
      if (e.pointerType === 'touch' && start?.id === e.pointerId && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) { lastTap.current = performance.now(); onOpen(book); }
    }} onClick={open}>
    <group position={[0, 0, nearby ? .035 : 0]} userData={{ interactivePhoto: true }}>
      <mesh material={pages} position={[.005, 0, -.07]}><boxGeometry args={[.68, 1, .12]} /></mesh>
      <mesh position={[0, 0, -.135]}><boxGeometry args={[.72, 1.04, .025]} /><meshStandardMaterial color={covers[index]} roughness={.8} /></mesh>
      <mesh position={[-.35, 0, -.07]}><boxGeometry args={[.035, 1.04, .15]} /><meshStandardMaterial color={covers[index]} roughness={.8} /></mesh>
      <mesh userData={{ interactivePhoto: true }}>
        <planeGeometry args={[.72, 1.04]} /><meshStandardMaterial map={texture ?? undefined} color={texture ? '#ffffff' : covers[index]} roughness={.8} />
      </mesh>
      {nearby && <mesh position={[0, 0, -.015]} raycast={noRaycast}>
        <planeGeometry args={[.78, 1.1]} /><meshBasicMaterial color="#f3c67d" />
      </mesh>}
    </group>
  </group>;
}

export default function Bookshelf({ charPos, nearbyId, onOpen, compact }: { charPos: THREE.Vector3; nearbyId: string | null; onOpen: (book: BookConfig) => void; compact: boolean }) {
  const [loadCovers, setLoadCovers] = useState(false);
  const [close, setClose] = useState(false);
  const proximity = useRef(false);
  useFrame(() => {
    const distance = Math.hypot(charPos.x - BOOKSHELF.position[0], charPos.z - BOOKSHELF.position[2]);
    if (!loadCovers && distance < 8) setLoadCovers(true);
    const next = distance < (proximity.current ? 6 : 5);
    if (next !== proximity.current) { proximity.current = next; setClose(next); }
  });
  return <group name="school-bookshelf" position={BOOKSHELF.position} rotation={[0, Math.PI, 0]} userData={{ cameraObstacle: true }}>
    <group>
      <mesh material={walnut} position={[0, 1.75, -.27]}><boxGeometry args={[4.06, 3.08, .12]} /></mesh>
      {[-1, 1].map(side => <mesh key={side} material={wood} position={[side * 1.99, 1.76, 0]} castShadow><boxGeometry args={[.12, 3.18, .7]} /></mesh>)}
      {[.18, .67, 1.84, 3.02, 3.35].map(y => <group key={y}>
        <mesh material={wood} position={[0, y, 0]} castShadow><boxGeometry args={[4.14, .1, .72]} /></mesh>
        <mesh material={gold} position={[0, y + .025, .365]}><boxGeometry args={[4.05, .018, .025]} /></mesh>
      </group>)}
      <mesh material={wood} position={[0, .42, .05]}><boxGeometry args={[3.9, .4, .55]} /></mesh>
      {[-1, 1].map(side => <mesh key={side} material={gold} position={[side * .3, .43, .335]}><sphereGeometry args={[.028, 8, 6]} /></mesh>)}
    </group>
    {[1.78, 2.96].map(y => <mesh key={y} position={[0, y, .13]} raycast={noRaycast}><boxGeometry args={[3.7, .025, .08]} /><meshStandardMaterial color="#ffe2aa" emissive="#ffcc87" emissiveIntensity={.9} /></mesh>)}
    {BOOKS.map((book, i) => <ShelfBook key={book.id} book={book} index={i} nearby={nearbyId === book.id} loadCover={loadCovers} onOpen={onOpen} />)}
    {close && <pointLight position={[0, 2.1, 1.15]} color="#ffd39b" intensity={compact ? .8 : 1.3} distance={5} decay={2} />}
  </group>;
}

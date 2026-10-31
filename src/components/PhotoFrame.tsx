import { acquirePhotoTexture } from '../lib/photoTextures';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { PhotoConfig } from '../config';
import { vintagePaperTexture } from '../lib/vintagePaper';

interface Props {
  active?: boolean;
  photo: PhotoConfig;
  onClick: () => void;
  nearby?: boolean;
  compact?: boolean;
  reducedMotion?: boolean;
}

const PHOTO_W = 1.46;
const PHOTO_H = 1.06;

function createFallbackTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, '#d4a574');
  grad.addColorStop(1, '#8b6f47');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 200, 160);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function PhotoFrame({ active = true, photo, onClick, nearby = false, compact = false, reducedMotion = false }: Props) {
  const paper = vintagePaperTexture();
  const { gl } = useThree();
  const tilt = ((Array.from(photo.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7) - 3) * .012;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTouchTap = useRef(-Infinity);

  useEffect(() => {
    if (!hovered) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = previous; };
  }, [hovered]);

  useEffect(() => {
    if (!active) { setTexture(null); return; }
    let disposed = false, fallback: THREE.Texture | undefined;
    const request = acquirePhotoTexture(photo.url, gl, compact);
    void request.promise.then(value => { if (!disposed) setTexture(value); }).catch(() => {
      if (!disposed) { fallback = createFallbackTexture(photo.title); setTexture(fallback); }
    });
    return () => { disposed = true; request.release(); fallback?.dispose(); };
  }, [active, photo.url, photo.title, compact, gl]);

  useFrame(({ clock }, delta) => {
    if (!active || !frameRef.current) return;
    const mat = frameRef.current.material as THREE.MeshStandardMaterial;
    const glow = hovered ? .13 : nearby ? .08 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.5) * .015) : .015;
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, glow, 8, delta);
  });

  // Give portraits comparable visual weight instead of squeezing them into
  // a landscape-height slot. Bound tall originals so they still fit the wall.
  const image = texture?.image as { width: number; height: number } | undefined;
  const aspect = image && image.width > 0 && image.height > 0
    ? image.width / image.height : PHOTO_W / PHOTO_H;
  const portrait = aspect < 1;
  const printHeight = portrait
    ? Math.min(1.85, Math.sqrt(PHOTO_W * PHOTO_H / aspect))
    : Math.min(PHOTO_H, PHOTO_W / aspect);
  const printWidth = printHeight * aspect;
  const sideBorder = portrait ? .085 : .12;
  const topBorder = portrait ? .075 : .1;
  const bottomBorder = portrait ? .20 : .3;
  const printOffset = (bottomBorder - topBorder) / 2;

  return (
    <group position={photo.position} rotation={photo.rotation} scale={photo.scale ?? 1} userData={{ interactivePhoto: true }}
      onPointerDown={event => { if (event.pointerType === 'touch') touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; }}
      onPointerCancel={() => { touchStart.current = null; }}
      onPointerUp={event => {
        const start = touchStart.current; touchStart.current = null;
        if (event.pointerType === 'touch' && start?.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) {
          lastTouchTap.current = performance.now();
          onClick();
        }
      }}
      onClick={() => { if (performance.now() - lastTouchTap.current > 500) onClick(); }}>
      <group rotation={[0, 0, tilt]} userData={{ interactivePhoto: true }}>
        <mesh ref={frameRef} castShadow>
          <boxGeometry args={[printWidth + sideBorder * 2, printHeight + topBorder + bottomBorder, .018]} />
          <meshStandardMaterial map={paper} roughness={.96} metalness={0} emissive="#f0dcb4" emissiveIntensity={.015} />
        </mesh>
        <mesh position={[0, printOffset, .012]} userData={{ interactivePhoto: true }} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <planeGeometry args={[printWidth, printHeight]} />
          <meshStandardMaterial map={texture ?? paper} emissiveMap={texture ?? paper} emissive="#fff1df" emissiveIntensity={.24} color="#fbf5e8" roughness={.88} />
        </mesh>
      </group>

    </group>
  );
}

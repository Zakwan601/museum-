import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { PhotoConfig } from '../config';
import { vintagePaperTexture } from '../lib/vintagePaper';

interface Props {
  photo: PhotoConfig;
  onClick: () => void;
  nearby?: boolean;
  compact?: boolean;
  reducedMotion?: boolean;
}

const FRAME_W = 1.7;
const FRAME_H = 1.46;
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

export default function PhotoFrame({ photo, onClick, nearby = false, compact = false, reducedMotion = false }: Props) {
  const paper = vintagePaperTexture();
  const tilt = ((Array.from(photo.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7) - 3) * .012;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const [hovered, setHovered] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTouchTap = useRef(-Infinity);
  useEffect(() => { if (nearby || hovered) setDetailed(true); }, [nearby, hovered]);

  useEffect(() => {
    if (!hovered) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = previous; };
  }, [hovered]);

  useEffect(() => {
    let disposed = false;
    let loaded: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const url = new URL(photo.url);
    url.searchParams.set('w', detailed ? '640' : '256');
    url.searchParams.set('h', detailed ? '480' : '192');
    url.searchParams.set('q', '75');
    loader.load(
      url.toString(),
      (tex) => {
        if (disposed) { tex.dispose(); return; }
        loaded = tex;
        tex.colorSpace = THREE.SRGBColorSpace;
        // Fill the print window without stretching portrait or panoramic photos.
        const image = tex.image as HTMLImageElement;
        const aspect = image.naturalWidth / image.naturalHeight, windowAspect = PHOTO_W / PHOTO_H;
        if (aspect > windowAspect) {
          tex.repeat.x = windowAspect / aspect; tex.offset.x = (1 - tex.repeat.x) / 2;
        } else {
          tex.repeat.y = aspect / windowAspect; tex.offset.y = (1 - tex.repeat.y) / 2;
        }
        setTexture(tex);
      },
      undefined,
      () => { if (!disposed) { loaded = createFallbackTexture(photo.title); setTexture(loaded); } },
    );
    return () => { disposed = true; loaded?.dispose(); };
  }, [photo.url, photo.title, detailed]);

  useEffect(() => {
    const light = spotRef.current;
    const parent = light?.parent;
    if (light && parent) { parent.add(light.target); return () => { parent.remove(light.target); }; }
  }, [nearby, compact]);

  useFrame(({ clock }, delta) => {
    if (!frameRef.current) return;
    const mat = frameRef.current.material as THREE.MeshStandardMaterial;
    const glow = hovered ? .13 : nearby ? .08 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.5) * .015) : .015;
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, glow, 8, delta);
  });

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
      {((!compact && !photo.roomIndex) || nearby) && <spotLight
        ref={spotRef}
        position={[0, 2, 0.3]}
        angle={0.45}
        penumbra={0.7}
        intensity={2.5}
        distance={7}
        color="#fff5e6"
      />}

      <group rotation={[0, 0, tilt]} userData={{ interactivePhoto: true }}>
        <mesh ref={frameRef} castShadow>
          <boxGeometry args={[FRAME_W, FRAME_H, .018]} />
          <meshStandardMaterial map={paper} roughness={.96} metalness={0} emissive="#f0dcb4" emissiveIntensity={.015} />
        </mesh>
        <mesh position={[0, .1, .012]} userData={{ interactivePhoto: true }} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <planeGeometry args={[PHOTO_W, PHOTO_H]} />
          <meshStandardMaterial map={texture ?? undefined} color={texture ? '#fbf5e8' : '#d4a574'} roughness={.88} onUpdate={material => { material.needsUpdate = true; }} />
        </mesh>
      </group>

    </group>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
export default function SceneReady({ onReady }: { onReady: () => void }) {
  const ready = useRef(false);
  useFrame(() => { if (!ready.current) { ready.current = true; onReady(); } });
  return null;
}

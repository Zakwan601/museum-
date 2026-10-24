import { endingFrozen } from '../lib/ending';
import type { EndingState } from '../lib/ending';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CakeState } from '../lib/cake';
import { CAKE } from '../lib/cake';
import { ease } from '../lib/kiss';

const COUNT = 39, OUTLINE = 32;
export default function HeartConstellation({ ending, cake, charPos, companionPos, reducedMotion }: { ending: EndingState; cake: CakeState; charPos: THREE.Vector3; companionPos: THREE.Vector3; reducedMotion: boolean }) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const brightness = useRef(1);
  const captured = useRef(false), center = useRef(new THREE.Vector3()), right = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const resources = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d')!, glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, 'rgba(255,255,255,1)'); glow.addColorStop(.22, 'rgba(255,255,255,.9)');
    glow.addColorStop(.5, 'rgba(255,255,255,.28)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const points = Array.from({ length: 3 }, (_, i) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(13 * 3), 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(13 * 3), 3));
      const material = new THREE.PointsMaterial({ map: texture, size: .07 + i * .025, vertexColors: true, transparent: true, opacity: .9, depthWrite: false, toneMapped: false });
      return { geometry, material };
    });
    const lines = new THREE.BufferGeometry();
    lines.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(OUTLINE * 6), 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#f7cd80', transparent: true, opacity: .35, depthWrite: false, toneMapped: false });
    return { points, lines, lineMaterial, texture, targets: Array.from({ length: COUNT }, () => new THREE.Vector3()), scratch: new THREE.Vector3() };
  }, []);
  useEffect(() => () => { resources.points.forEach(p => { p.geometry.dispose(); p.material.dispose(); }); resources.lines.dispose(); resources.lineMaterial.dispose(); resources.texture.dispose(); }, [resources]);
  useFrame(({ clock }, delta) => {
    const active = cake.phase === 'constellation' || cake.phase === 'heartHold';
    if (group.current) group.current.visible = active;
    if (!active) { captured.current = false; return; }
    if (!captured.current) {
      captured.current = true;
      center.current.copy(charPos).add(companionPos).add(CAKE.position).multiplyScalar(1 / 3).setY(3.25);
      forward.current.copy(camera.position).sub(center.current).setY(0).normalize();
      right.current.set(forward.current.z, 0, -forward.current.x);
      center.current.addScaledVector(forward.current, -.45);
      resources.targets.forEach((v, i) => {
        const t = i / OUTLINE * Math.PI * 2;
        const x = i < OUTLINE ? 16 * Math.sin(t) ** 3 / 16 * 1.16 : Math.cos(i * 2.4) * 1.5;
        const y = i < OUTLINE ? (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 * 1.16 : Math.sin(i * 2.4) * 1.15;
        v.copy(center.current).addScaledVector(right.current, x); v.y += y;
        v.addScaledVector(forward.current, Math.sin(t * 3) * .08);
      });
      const positions = resources.lines.getAttribute('position');
      for (let i = 0; i < OUTLINE; i++) {
        const a = resources.targets[i], b = resources.targets[(i + 1) % OUTLINE];
        positions.setXYZ(i * 2, a.x, a.y, a.z); positions.setXYZ(i * 2 + 1, b.x, b.y, b.z);
      }
      positions.needsUpdate = true;
    }
    brightness.current = THREE.MathUtils.damp(brightness.current, endingFrozen(ending) ? .28 : 1, 1.3, Math.min(delta, .05));
    resources.points.forEach(p => { p.material.opacity = .9 * brightness.current; });
    resources.lineMaterial.opacity = .35 * brightness.current;
    const progress = cake.heartProgress;
    resources.points.forEach((p, batch) => {
      const positions = p.geometry.getAttribute('position'), colors = p.geometry.getAttribute('color');
      for (let j = 0; j < 13; j++) {
        const i = j * 3 + batch, phase = i / COUNT;
        const settle = ease((progress - phase * .35 - .12) / .52);
        const rise = Math.min(1, progress * (1.5 + (i % 4) * .13));
        const v = resources.scratch.copy(charPos).add(companionPos).multiplyScalar(.5).lerp(CAKE.position, (i % 3) / 3);
        v.x += Math.sin(i * 2.4) * (.35 + rise * .15); v.z += Math.cos(i * 2.4) * .35;
        v.y = .7 + rise * (1.3 + (i % 5) * .16);
        if (!reducedMotion) v.addScaledVector(right.current, Math.sin(progress * 5 + i) * .09 * (1 - settle));
        v.lerp(resources.targets[i], settle);
        positions.setXYZ(j, v.x, v.y, v.z);
        const twinkle = reducedMotion ? 1 : .88 + Math.sin(clock.elapsedTime * .7 + i * 1.7) * .12;
        const brightness = Math.min(1, progress * 7) * twinkle * (i < OUTLINE ? 1 : .55);
        colors.setXYZ(j, brightness, brightness * (.75 + (i % 3) * .05), brightness * .42);
      }
      positions.needsUpdate = colors.needsUpdate = true;
    });
    resources.lines.setDrawRange(0, Math.max(0, Math.min(OUTLINE, Math.floor((progress - .66) / .34 * OUTLINE + .00001))) * 2);
  });
  return <group ref={group} name="golden-heart-constellation" visible={false}>
    {resources.points.map((p, i) => <points key={i} geometry={p.geometry} material={p.material} frustumCulled={false} raycast={() => {}} />)}
    <lineSegments geometry={resources.lines} material={resources.lineMaterial} frustumCulled={false} raycast={() => {}} />
  </group>;
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ease } from '../lib/kiss';
import type { KissState } from '../lib/kiss';

const noRaycast = () => {};

export default function KissParticles({ kiss, compact, reducedMotion, suspended }: {
  kiss: KissState; compact: boolean; reducedMotion: boolean; suspended: boolean;
}) {
  const motes = useRef<THREE.InstancedMesh>(null);
  const hearts = useRef<THREE.InstancedMesh>(null);
  const count = compact ? 12 : 20;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const assets = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, '#fff9e9');
    glow.addColorStop(.15, 'rgba(255,225,211,.95)');
    glow.addColorStop(.4, 'rgba(255,168,192,.3)');
    glow.addColorStop(1, 'rgba(255,168,192,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const heart = new THREE.Shape();
    heart.moveTo(0, -.5);
    heart.bezierCurveTo(-1, .1, -.5, .85, 0, .35);
    heart.bezierCurveTo(.5, .85, 1, .1, 0, -.5);
    return {
      texture, plane: new THREE.PlaneGeometry(1, 1), heart: new THREE.ShapeGeometry(heart, 12),
      glow: new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      rose: new THREE.MeshBasicMaterial({ color: '#ffb4cb', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    };
  }, []);
  useEffect(() => () => {
    assets.texture.dispose(); assets.plane.dispose(); assets.heart.dispose();
    assets.glow.dispose(); assets.rose.dispose();
  }, [assets]);

  useFrame(({ camera }) => {
    if (!motes.current || !hearts.current) return;
    const t = kiss.elapsed;
    const strength = ease((t - .8) / 1.2) * (1 - ease((t - 4.5) / 1.7));
    const visible = !suspended && kiss.active && kiss.mode === 'kiss' && strength > .001;
    motes.current.visible = hearts.current.visible = visible;
    if (!visible) return;
    assets.glow.opacity = strength * .6;
    assets.rose.opacity = strength * .45;
    // Two rising ribbons surround the embrace, leaving their faces clear.
    for (const [mesh, total, isHeart] of [[motes.current, count, false], [hearts.current, 3, true]] as const) {
      for (let i = 0; i < total; i++) {
        const seed = i * 2.39996 + (isHeart ? 1.7 : 0);
        const life = reducedMotion ? (i + .5) / total : THREE.MathUtils.euclideanModulo(t * (isHeart ? .19 : .27) + i / total, 1);
        const turn = seed + (reducedMotion ? 0 : t * .65) + life * 2.2;
        const radius = .65 + Math.sin(seed * 3) * .12 + life * .22;
        dummy.position.set(kiss.center.x + Math.cos(turn) * radius, .35 + life * 1.75, kiss.center.z + Math.sin(turn) * radius * .7);
        dummy.quaternion.copy(camera.quaternion);
        dummy.rotateZ(Math.sin(seed + (reducedMotion ? 0 : t)) * .22);
        const envelope = Math.sin(Math.PI * life);
        dummy.scale.setScalar((isHeart ? .075 : .08 + (i % 4) * .018) * envelope * (reducedMotion ? .7 : 1));
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
        if (!isHeart) mesh.setColorAt(i, newColor.set(i % 3 === 0 ? '#ffd99d' : '#ffcedd'));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return <>
    <instancedMesh ref={motes} name="kiss-flowing-glow" args={[assets.plane, assets.glow, count]} visible={false} frustumCulled={false} raycast={noRaycast} dispose={null} />
    <instancedMesh ref={hearts} name="kiss-floating-hearts" args={[assets.heart, assets.rose, 3]} visible={false} frustumCulled={false} raycast={noRaycast} dispose={null} />
  </>;
}

const newColor = new THREE.Color();

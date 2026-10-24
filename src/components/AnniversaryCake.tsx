import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAKE } from '../lib/cake';
import type { CakeState } from '../lib/cake';
import { GARDEN_CENTER_X } from '../lib/gardenLayout';

const noRaycast = () => {};
export default function AnniversaryCake({ cake, reducedMotion = false }: { cake: CakeState; reducedMotion?: boolean }) {
  const flameGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const flameMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffdf93', transparent: true, opacity: .9, toneMapped: false }), []);
  useEffect(() => () => { flameGeometry.dispose(); flameMaterial.dispose(); }, [flameGeometry, flameMaterial]);
  const flames = useRef<THREE.Group>(null);
  const candleLight = useRef<THREE.PointLight>(null);
  const puff = useRef<THREE.Points>(null);
  const puffGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12 * 3), 3)); return g;
  }, []);
  useEffect(() => () => puffGeometry.dispose(), [puffGeometry]);
  const light = useRef<THREE.PointLight>(null);
  const lastReveal = useRef(-1);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const pearls = useRef<THREE.InstancedMesh>(null);
  const candles = useRef<THREE.InstancedMesh>(null);
  const palette = useMemo(() => ['#eedee1', '#f7e6ce', '#e9b7c3', '#b99461', '#8e738d'].map(hex => ({
    color: new THREE.Color(hex), material: new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).multiplyScalar(.008), roughness: .72 }),
  })), []);
  const pedestal = useMemo(() => new THREE.LatheGeometry([
    [0, 0], [.30, 0], [.33, .035], [.30, .07], [.12, .12], [.075, .22], [.07, .52], [.12, .65], [.36, .69], [.38, .72], [.36, .75], [0, .75],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 24), []);
  const poolTexture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,224,158,.8)'); gradient.addColorStop(.45, 'rgba(255,213,143,.3)'); gradient.addColorStop(1, 'rgba(255,213,143,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 14; i++) {
      const angle = i / 14 * Math.PI * 2;
      dummy.position.set(Math.sin(angle) * .235, 1.025, Math.cos(angle) * .235);
      dummy.scale.set(.035, .028, .035); dummy.updateMatrix(); pearls.current?.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < 3; i++) {
      const angle = i / 3 * Math.PI * 2;
      dummy.position.set(Math.sin(angle) * .12, 1.115, Math.cos(angle) * .12);
      dummy.scale.set(1, 1, 1); dummy.updateMatrix(); candles.current?.setMatrixAt(i, dummy.matrix);
    }
    if (pearls.current) pearls.current.instanceMatrix.needsUpdate = true;
    if (candles.current) candles.current.instanceMatrix.needsUpdate = true;
  }, []);
  useEffect(() => () => { palette.forEach(p => p.material.dispose()); pedestal.dispose(); poolTexture.dispose(); }, [palette, pedestal, poolTexture]);
  useFrame(() => {
    if (flames.current) flames.current.children.forEach((flame, i) => {
      const amount = i < cake.lit ? cake.flame : 0;
      flame.visible = amount > .001;
      flame.scale.set(.019 * amount, .045 * amount, .019 * amount);
    });
    if (candleLight.current) candleLight.current.intensity = cake.lit / 3 * cake.flame * .65;
    if (puff.current) {
      const t = cake.phase === 'blowing' ? (cake.elapsed - 1.5) / 1.3 : -1;
      puff.current.visible = !reducedMotion && t > 0 && t < 1;
      if (puff.current.visible) {
        const positions = puffGeometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          const a = i * 2.39996, radius = (.05 + i * .012) * t;
          positions.setXYZ(i, Math.sin(a) * radius, 1.24 + t * (.18 + (i % 3) * .08), Math.cos(a) * radius);
        }
        positions.needsUpdate = true;
        (puff.current.material as THREE.PointsMaterial).opacity = (1 - t) * .7;
      }
    }

    if (lastReveal.current === cake.reveal) return;
    lastReveal.current = cake.reveal;
    palette.forEach(p => p.material.color.copy(p.color).multiplyScalar(.008 + cake.reveal * .992));
    if (light.current) light.current.intensity = cake.reveal * 3.8;
    if (pool.current) pool.current.opacity = cake.reveal * .25;
    if (shadow.current) {
      shadow.current.visible = cake.reveal < .999;
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = (1 - cake.reveal) * .82;
    }
  });
  return <group name="anniversary-cake" position={[CAKE.position.x - GARDEN_CENTER_X, .04, CAKE.position.z]} userData={{ cake: true }}>
    <mesh name="cake-pedestal" geometry={pedestal} material={palette[0].material} />
    <mesh position={[0, .735, 0]} rotation={[Math.PI / 2, 0, 0]} material={palette[3].material}><torusGeometry args={[.365, .012, 6, 24]} /></mesh>
    <mesh position={[0, .78, 0]} material={palette[3].material}><cylinderGeometry args={[.31, .31, .025, 24]} /></mesh>
    <mesh position={[0, .9, 0]} material={palette[2].material}><cylinderGeometry args={[.25, .25, .22, 24]} /></mesh>
    <mesh position={[0, 1.015, 0]} material={palette[1].material}><cylinderGeometry args={[.255, .255, .035, 24]} /></mesh>
    <mesh position={[0, .82, 0]} rotation={[Math.PI / 2, 0, 0]} material={palette[1].material}><torusGeometry args={[.248, .021, 6, 24]} /></mesh>
    <instancedMesh ref={pearls} name="cake-frosting-pearls" args={[undefined, palette[1].material, 14]}><sphereGeometry args={[1, 8, 5]} /></instancedMesh>
    <instancedMesh ref={candles} name="cake-unlit-candles" args={[undefined, palette[4].material, 3]}><cylinderGeometry args={[.017, .017, .15, 8]} /></instancedMesh>
    {[0, 1, 2].map(i => { const a = i / 3 * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * .12, 1.199, Math.cos(a) * .12]} material={palette[3].material}><cylinderGeometry args={[.003, .003, .023, 4]} /></mesh>; })}
    <group ref={flames} name="cake-flames">
      {[0, 1, 2].map(i => { const a = i / 3 * Math.PI * 2; return <mesh geometry={flameGeometry} material={flameMaterial} key={i} visible={false} position={[Math.sin(a) * .12, 1.24, Math.cos(a) * .12]} raycast={noRaycast}>
      </mesh>; })}
    </group>
    <pointLight ref={candleLight} name="cake-candle-light" position={[0, 1.35, 0]} intensity={0} color="#ffbd69" distance={3} decay={2} castShadow={false} />
    <points ref={puff} name="cake-wish-sparkles" geometry={puffGeometry} visible={false} frustumCulled={false} raycast={noRaycast}>
      <pointsMaterial color="#ffe7b2" size={.025} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </points>
    <pointLight ref={light} name="cake-reveal-light" position={[.1, 1.45, .15]} color="#ffd79a" intensity={0} distance={2.65} decay={2} castShadow={false} />
    <mesh ref={shadow} name="cake-dark-surroundings" position={[0, .052, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <planeGeometry args={[2.4, 2.4]} /><meshBasicMaterial color="#080a17" map={poolTexture} transparent opacity={.82} depthWrite={false} />
    </mesh>
    <mesh name="cake-golden-pool" position={[0, .055, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
      <planeGeometry args={[2.2, 2.2]} /><meshBasicMaterial ref={pool} map={poolTexture} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}

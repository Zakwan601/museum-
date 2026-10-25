import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 12, LIFE = .6;
export default function FootstepSparkles({ position, motion, enabled }: {
  position: THREE.Vector3; motion: MutableRefObject<number>; enabled: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useMemo(() => ({
    last: new THREE.Vector3(), initialized: false, elapsed: 0, next: 0,
    particles: Array.from({ length: COUNT }, () => ({ x: 0, z: 0, age: LIFE, turn: 0 })),
    dummy: new THREE.Object3D(),
  }), []);
  const assets = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = i % 2 ? .22 : 1;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i) shape.lineTo(x, y); else shape.moveTo(x, y);
    }
    shape.closePath();
    return {
      geometry: new THREE.ShapeGeometry(shape),
      material: new THREE.MeshBasicMaterial({ color: '#fff2cf', transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending }),
    };
  }, []);
  useEffect(() => () => { assets.geometry.dispose(); assets.material.dispose(); }, [assets]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const dt = Math.min(delta, .05), distance = state.last.distanceTo(position);
    if (!enabled || !state.initialized || distance > 1) {
      state.particles.forEach(p => { p.age = LIFE; }); state.elapsed = 0;
    } else if (motion.current > .15 && distance > .001) {
      state.elapsed += dt;
      if (state.elapsed >= .12) {
        state.elapsed %= .12;
        const dx = (position.x - state.last.x) / distance, dz = (position.z - state.last.z) / distance;
        for (const side of [-1, 1]) {
          const p = state.particles[state.next++ % COUNT];
          p.x = position.x + dz * side * .14 - dx * .045;
          p.z = position.z - dx * side * .14 - dz * .045;
          p.age = 0; p.turn = state.next * 2.4;
        }
      }
    } else state.elapsed = 0;
    let visible = false;
    state.particles.forEach((p, i) => {
      p.age = Math.min(LIFE, p.age + dt);
      const t = p.age / LIFE, size = Math.sin(t * Math.PI) * (.032 + i % 3 * .008);
      state.dummy.position.set(p.x, .045 + t * .055, p.z);
      state.dummy.rotation.set(-Math.PI / 2, 0, p.turn + t * .25);
      state.dummy.scale.setScalar(size); state.dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, state.dummy.matrix);
      visible ||= t < 1;
    });
    mesh.current.instanceMatrix.needsUpdate = true; mesh.current.visible = visible;
    state.last.copy(position); state.initialized = true;
  });
  return <instancedMesh ref={mesh} name="girl-footstep-sparkles" args={[assets.geometry, assets.material, COUNT]} visible={false} frustumCulled={false} raycast={() => {}} dispose={null} />;
}

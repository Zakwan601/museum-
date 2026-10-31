import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { rose } from '../lib/roseGeometry';
const leaf = new THREE.SphereGeometry(1, 8, 5);
const petals = new THREE.MeshStandardMaterial({ roughness: .8, side: THREE.DoubleSide });
const greenery = new THREE.MeshStandardMaterial({ color: '#8b9e86', roughness: .95 });
const noRaycast = () => {};
// Small upper-corner clusters leave the passage and its label fully open.
export default function ArchFlorals({ palette }: { palette: number }) {
  const flowers = useRef<THREE.InstancedMesh>(null), leaves = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const colors = palette === 1 ? ['#d3bddf', '#f1dce7', '#fff0dd'] : palette === 2 ? ['#edc0ae', '#fff0da', '#dca3a8'] : ['#e6adc0', '#fff0e1', '#d393ab'];
    const angles = [2.48, 2.36, 2.25, 2.13, .74, .62];
    angles.forEach((a, i) => {
      object.position.set(Math.cos(a) * 2.18, 2.25 + Math.sin(a) * 2.18, .065);
      object.rotation.set(Math.PI / 2, i * .7, (i % 2 ? -.1 : .1)); object.scale.setScalar(i === 1 || i === 4 ? 2.15 : 1.65); object.updateMatrix();
      flowers.current!.setMatrixAt(i, object.matrix); flowers.current!.setColorAt(i, new THREE.Color(colors[i % 3]));
      object.position.set(Math.cos(a + .075) * 2.24, 2.25 + Math.sin(a + .075) * 2.24, .025);
      object.rotation.set(0, 0, a); object.scale.set(.13, .04, .025); object.updateMatrix(); leaves.current!.setMatrixAt(i, object.matrix);
    });
    const a = flowers.current!, b = leaves.current!;
    a.instanceMatrix.needsUpdate = b.instanceMatrix.needsUpdate = true;
    a.instanceColor!.needsUpdate = true; a.computeBoundingSphere(); b.computeBoundingSphere();
    return () => { a.dispose(); b.dispose(); };
  }, [palette]);
  return <group name="arch-floral-accents" dispose={null}>
    <instancedMesh ref={leaves} args={[leaf, greenery, 6]} raycast={noRaycast} />
    <instancedMesh ref={flowers} args={[rose, petals, 6]} raycast={noRaycast} />
  </group>;
}

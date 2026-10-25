import { rose } from '../lib/roseGeometry';
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { BouquetPose } from '../lib/bouquet';

const wrapper = (() => {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 6; i++) points.push(new THREE.Vector2(.026 + (i / 6) ** 1.3 * .13, -.04 + i / 6 * .26));
  return new THREE.LatheGeometry(points, 28);
})();
const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(-.065, .065, 0, .14); leaf.quadraticCurveTo(.065, .065, 0, 0);
const leafGeometry = new THREE.ShapeGeometry(leaf, 8);
const heads = Array.from({ length: 7 }, (_, i) => new THREE.Vector3(i ? Math.cos(i * Math.PI / 3) * .105 : 0, i ? .255 + (i % 2) * .018 : .29, i ? Math.sin(i * Math.PI / 3) * .105 : 0));

export default function RoseBouquet({ pose }: { pose: MutableRefObject<BouquetPose> }) {
  const group = useRef<THREE.Group>(null), flowers = useRef<THREE.InstancedMesh>(null), stems = useRef<THREE.InstancedMesh>(null), leaves = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
    heads.forEach((p, i) => {
      object.position.copy(p); object.scale.setScalar(1); object.rotation.set((i % 2) * .12, i * .7, (i % 3 - 1) * .15); object.updateMatrix();
      flowers.current!.setMatrixAt(i, object.matrix); flowers.current!.setColorAt(i, new THREE.Color(i % 3 ? '#bf294c' : '#ed8b9c'));
      object.position.copy(p).multiplyScalar(.5); object.quaternion.setFromUnitVectors(up, p.clone().normalize()); object.scale.set(.005, p.length(), .005); object.updateMatrix(); stems.current!.setMatrixAt(i, object.matrix);
      object.position.set(p.x * 1.3, .18, p.z * 1.3); object.rotation.set(.7, i * Math.PI / 3, -.5); object.scale.setScalar(1); object.updateMatrix(); leaves.current!.setMatrixAt(i, object.matrix);
    });
    for (const mesh of [flowers.current!, stems.current!, leaves.current!]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
    flowers.current!.instanceColor!.needsUpdate = true;
  }, []);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = pose.current.visible;
    group.current.position.copy(pose.current.position); group.current.quaternion.copy(pose.current.rotation);
  });
  return <group ref={group} name="anniversary-rose-bouquet" visible={false}>
    <instancedMesh ref={stems} args={[undefined, undefined, 7]}><cylinderGeometry args={[1, 1, 1, 6]} /><meshStandardMaterial color="#466742" roughness={.9} /></instancedMesh>
    <mesh geometry={wrapper}><meshStandardMaterial color="#e7b8b7" roughness={.9} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={wrapper} scale={[1.06, .91, 1.06]} position={[0, .035, 0]}><meshStandardMaterial color="#f9e9d3" roughness={1} side={THREE.DoubleSide} /></mesh>
    <instancedMesh ref={leaves} args={[leafGeometry, undefined, 7]}><meshStandardMaterial color="#60794e" side={THREE.DoubleSide} roughness={.9} /></instancedMesh>
    <instancedMesh ref={flowers} args={[rose, undefined, 7]}><meshStandardMaterial roughness={.7} side={THREE.DoubleSide} /></instancedMesh>
    {[-1, 1].map(side => <group key={side} position={[side * .035, .035, .048]} rotation={[0, 0, side * .3]}>
      <mesh scale={[1.3, .65, 1]}><torusGeometry args={[.029, .008, 5, 14]} /><meshStandardMaterial color="#a4284c" roughness={.6} /></mesh>
      <mesh position={[side * .008, -.05, 0]} rotation={[0, 0, side * -.28]}><boxGeometry args={[.017, .08, .006]} /><meshStandardMaterial color="#a4284c" roughness={.6} /></mesh>
    </group>)}
    <mesh position={[0, .035, .055]}><sphereGeometry args={[.016, 8, 6]} /><meshStandardMaterial color="#aa3051" roughness={.6} /></mesh>
  </group>;
}

import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EarFlowerPose } from '../lib/earFlower';
const petal = new THREE.SphereGeometry(1, 8, 6);
const pink = new THREE.MeshStandardMaterial({ color: '#f6b6cf', roughness: .65 });
const gold = new THREE.MeshStandardMaterial({ color: '#ffd996', roughness: .65 });
const green = new THREE.MeshStandardMaterial({ color: '#71996a', roughness: .9 });
export default function EarFlower({ pose, attached = false }: { pose: MutableRefObject<EarFlowerPose>; attached?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = attached ? pose.current.attached : pose.current.visible && !pose.current.attached;
    if (attached) { group.current.position.set(pose.current.side * .36, .005, .23); group.current.rotation.y = pose.current.side * .65; }
    else { group.current.position.copy(pose.current.position); group.current.quaternion.copy(pose.current.rotation); group.current.rotateY(pose.current.side * .65); }
  });
  return <group ref={group} name={attached ? 'girl-ear-flower' : 'offered-ear-flower'} visible={false} scale={1.15}>
    {Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <mesh key={i} geometry={petal} material={pink} position={[Math.sin(a) * .044, Math.cos(a) * .044, 0]} rotation={[0, 0, -a]} scale={[.031, .046, .014]} />; })}
    <mesh geometry={petal} material={gold} position={[0, 0, .014]} scale={[.021, .021, .013]} />
    <mesh geometry={petal} material={green} position={[.02, -.064, -.012]} rotation={[0, 0, -.55]} scale={[.014, .04, .008]} />
  </group>;
}

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOM, CHARACTER, FLOWER_POSITIONS } from '../config';
import type { ControlState, CameraState } from '../controls';
import Chibi from './Chibi';
import { ease } from '../lib/kiss';
import type { KissState } from '../lib/kiss';
import { constrainMuseumPosition, museumRoomAt, PASSAGE } from '../lib/museumLayout';
interface Props { controls: ControlState; cameraState: CameraState; charPos: THREE.Vector3; companionPos: THREE.Vector3; kiss: KissState; reducedMotion?: boolean }
export default function Character({ controls, cameraState, charPos, companionPos, kiss, reducedMotion = false }: Props) {
  const group = useRef<THREE.Group>(null), companion = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3()), follow = useRef(new THREE.Vector3());
  const motion = useRef(0), companionMotion = useRef(0), heading = useRef(0);
  const followSide = useRef(1);
  const companionVelocity = useRef(new THREE.Vector3());
  const kissPose = useRef(0);
  const photoPose = useRef(0);
  const saved = useRef({ sequence: 0, player: new THREE.Vector3(), partner: new THREE.Vector3(), playerYaw: 0, partnerYaw: 0, target: new THREE.Vector3() });
  useEffect(() => { charPos.set(0, 0, 4); }, [charPos]);
  useFrame((_, frameDelta) => {
    if (!group.current || !companion.current) return;
    const delta = Math.min(frameDelta, .05);
    if (kiss.active) {
      const state = saved.current;
      if (state.sequence !== kiss.sequence) {
        state.sequence = kiss.sequence;
        state.player.copy(group.current.position); state.partner.copy(companion.current.position);
        state.playerYaw = group.current.rotation.y; state.partnerYaw = companion.current.rotation.y;
        kiss.center.copy(state.player).add(state.partner).multiplyScalar(.5);
        const photo = kiss.mode === 'photo';
        const room = museumRoomAt(state.player.x);
        kiss.center.x = room.centerX + THREE.MathUtils.clamp(kiss.center.x - room.centerX, photo ? -3.5 : -7, photo ? 3.5 : 7);
        kiss.center.z = THREE.MathUtils.clamp(kiss.center.z, photo ? -1 : -4, photo ? 1 : 4);
        kiss.axis.set(Math.cos(cameraState.smoothedAzimuth), 0, -Math.sin(cameraState.smoothedAzimuth));
      }
      const t = kiss.elapsed, approach = ease(t / 1.8), retreat = ease((t - 4.6) / 1.6);
      const faceYaw = Math.atan2(kiss.axis.x, kiss.axis.z);
      const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
      const pose = (actor: THREE.Group, origin: THREE.Vector3, yaw: number, side: number, targetYaw: number, speed: { current: number }) => {
        const oldX = actor.position.x, oldZ = actor.position.z;
        state.target.copy(kiss.center).addScaledVector(kiss.axis, side * (kiss.mode === 'photo' ? .5 : .365));
        actor.position.lerpVectors(origin, state.target, approach).lerp(origin, retreat);
        actor.rotation.y = yaw + angle(targetYaw, yaw) * approach * (1 - retreat);
        speed.current = Math.hypot(actor.position.x - oldX, actor.position.z - oldZ) / Math.max(delta, .001);
      };
      const photoYaw = Math.atan2(-kiss.axis.z, kiss.axis.x);
      pose(group.current, state.player, state.playerYaw, -1, kiss.mode === 'photo' ? photoYaw + .06 : faceYaw, motion);
      pose(companion.current, state.partner, state.partnerYaw, 1, kiss.mode === 'photo' ? photoYaw - .06 : faceYaw + Math.PI, companionMotion);
      kissPose.current = kiss.mode === 'kiss' ? ease((t - 1.5) / .6) * (1 - ease((t - 4.2) / .5)) : 0;
      photoPose.current = kiss.mode === 'photo' ? ease((t - 1) / .8) * (1 - retreat) : 0;
      velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0);
      charPos.copy(group.current.position);
      companionPos.copy(companion.current.position);
      return;
    }
    kissPose.current = 0;
    photoPose.current = 0;
    let x = controls.keyboardX + controls.joystickX;
    let y = controls.keyboardY + controls.joystickY;
    if (controls.paused) { x = 0; y = 0; velocity.current.set(0, 0, 0); }
    const inputLength = Math.hypot(x, y);
    const strength = Math.max(0, (Math.min(inputLength, 1) - .08) / .92);
    if (inputLength > 0) { x = x / inputLength * strength; y = y / inputLength * strength; }
    const damping = 1 - Math.exp(-(strength > 0 ? 10 : 18) * delta);
    const az = cameraState.smoothedAzimuth;
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, (-y * Math.sin(az) + x * Math.cos(az)) * CHARACTER.speed, damping);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, (-y * Math.cos(az) - x * Math.sin(az)) * CHARACTER.speed, damping);
    const startX = group.current.position.x, startZ = group.current.position.z;
    group.current.position.addScaledVector(velocity.current, delta);
    const requestedX = group.current.position.x, requestedZ = group.current.position.z;
    const margin = CHARACTER.radius + .4;
    const clamp = (p: THREE.Vector3) => {
      constrainMuseumPosition(p);
      for (const [x, , z] of FLOWER_POSITIONS) {
        const dx = p.x - x, dz = p.z - z, distance = Math.hypot(dx, dz), radius = CHARACTER.radius + .34;
        if (distance >= radius) continue;
        const direction = Math.atan2(dz, dx);
        p.x = THREE.MathUtils.clamp(x + Math.cos(direction) * radius, -ROOM.width / 2 + margin, ROOM.width / 2 - margin);
        p.z = THREE.MathUtils.clamp(z + Math.sin(direction) * radius, -ROOM.depth / 2 + margin, ROOM.depth / 2 - margin);
        if (Math.hypot(p.x - x, p.z - z) < radius - .001) p.x = x + (dx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, radius ** 2 - (p.z - z) ** 2));
      }
      constrainMuseumPosition(p);
    };
    clamp(group.current.position);
    // Remove velocity into walls while allowing motion along them.
    if ((requestedX - group.current.position.x) * velocity.current.x > .00001) velocity.current.x = 0;
    if ((requestedZ - group.current.position.z) * velocity.current.z > .00001) velocity.current.z = 0;
    charPos.copy(group.current.position);
    motion.current = Math.hypot(charPos.x - startX, charPos.z - startZ) / Math.max(delta, .001);
    if (motion.current > .1) heading.current = Math.atan2(velocity.current.x, velocity.current.z);
    const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += angle(heading.current, group.current.rotation.y) * (1 - Math.exp(-CHARACTER.rotationSpeed * delta));
    follow.current.set(1.05 * followSide.current, 0, -.35).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(charPos);
    clamp(follow.current);
    if (follow.current.distanceToSquared(charPos) < .81) {
      followSide.current *= -1;
      follow.current.set(1.05 * followSide.current, 0, -.35).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(charPos);
      clamp(follow.current);
    }
    const playerRoom = museumRoomAt(charPos.x), partnerRoom = museumRoomAt(companion.current.position.x);
    if (playerRoom.index !== partnerRoom.index) {
      const direction = Math.sign(playerRoom.index - partnerRoom.index);
      // Enter the passage centrally so the partner cannot get caught on its jamb.
      const aligned = Math.abs(companion.current.position.z) < PASSAGE.width / 2 - 1;
      follow.current.set(partnerRoom.centerX + direction * (aligned ? ROOM.width / 2 + PASSAGE.length : ROOM.width / 2 - 1.2), 0, 0);
    }
    const oldX = companion.current.position.x, oldZ = companion.current.position.z;
    follow.current.sub(companion.current.position);
    const distance = follow.current.length();
    const followSpeed = distance < .035 ? 0 : Math.min(CHARACTER.speed * 1.35, distance * 4);
    follow.current.multiplyScalar(distance > 0 ? followSpeed / distance : 0);
    companionVelocity.current.lerp(follow.current, 1 - Math.exp(-10 * delta));
    companion.current.position.addScaledVector(companionVelocity.current, delta);
    clamp(companion.current.position);
    companionMotion.current = Math.hypot(companion.current.position.x - oldX, companion.current.position.z - oldZ) / Math.max(delta, .001);
    const companionHeading = companionMotion.current > .12
      ? Math.atan2(companion.current.position.x - oldX, companion.current.position.z - oldZ)
      : group.current.rotation.y;
    companion.current.rotation.y += angle(companionHeading, companion.current.rotation.y) * (1 - Math.exp(-9 * delta));
    companionPos.copy(companion.current.position);
  }, -1);
  return <>
    <group ref={group} position={[0, 0, 4]}><Chibi variant="lavender" motion={motion} kissPose={kissPose} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
    <group ref={companion} position={[1.05, 0, 3.78]}><Chibi variant="rose" motion={companionMotion} kissPose={kissPose} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
  </>;
}


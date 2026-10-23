import { endingFrozen } from '../lib/ending';
import type { EndingState } from '../lib/ending';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ROOM, CHARACTER, FLOWER_POSITIONS } from '../config';
import type { ControlState, CameraState } from '../controls';
import Chibi from './Chibi';
import RoseBouquet from './RoseBouquet';
import { createBouquetPose, createGiftGrip } from '../lib/bouquet';
import { ease } from '../lib/kiss';
import type { KissState } from '../lib/kiss';
import { constrainMuseumPosition, museumRoomAt, PASSAGE, MUSEUM_ROOMS } from '../lib/museumLayout';
import type { RoomTransitionState } from '../lib/roomTransition';
interface Props { ending: EndingState; transition: RoomTransitionState; controls: ControlState; cameraState: CameraState; charPos: THREE.Vector3; companionPos: THREE.Vector3; kiss: KissState; reducedMotion?: boolean }
export default function Character({ ending, transition, controls, cameraState, charPos, companionPos, kiss, reducedMotion = false }: Props) {
  const group = useRef<THREE.Group>(null), companion = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3()), follow = useRef(new THREE.Vector3());
  const motion = useRef(0), companionMotion = useRef(0), heading = useRef(0);
  const followSide = useRef(1);
  const lastRelocation = useRef(0);
  const companionVelocity = useRef(new THREE.Vector3());
  const kissPose = useRef(0);
  const kissHands = useRef<[THREE.Vector3, THREE.Vector3]>([new THREE.Vector3(), new THREE.Vector3()]);
  const photoPose = useRef(0);
  const bouquet = useRef(createBouquetPose());
  const receiver = useRef(createGiftGrip()), giver = useRef(createGiftGrip());
  const giftScratch = useRef({ boy: new THREE.Vector3(), girl: new THREE.Vector3(), middle: new THREE.Vector3(), right: new THREE.Vector3(), rotation: new THREE.Quaternion() });
  const setGiftHands = (actor: THREE.Group, grip: typeof receiver.current, amount: number) => {
    grip.amount = amount;
    giftScratch.current.right.set(Math.cos(actor.rotation.y), 0, -Math.sin(actor.rotation.y));
    grip.hands.forEach((hand, i) => hand.copy(bouquet.current.position).addScaledVector(giftScratch.current.right, i ? .05 : -.05));
  };
  const saved = useRef({ sequence: 0, player: new THREE.Vector3(), partner: new THREE.Vector3(), playerYaw: 0, partnerYaw: 0, target: new THREE.Vector3() });
  useEffect(() => { charPos.set(0, 0, 4); }, [charPos]);
  useFrame((_, frameDelta) => {
    if (!group.current || !companion.current) return;
    const delta = Math.min(frameDelta, .05);
    if (lastRelocation.current !== transition.relocation) {
      lastRelocation.current = transition.relocation;
      const direction = transition.direction, x = MUSEUM_ROOMS[transition.to].centerX - direction * (ROOM.width / 2 - 2.8);
      group.current.position.set(x, 0, direction * .525);
      companion.current.position.set(x - direction * .35, 0, -direction * .525);
      heading.current = direction * Math.PI / 2; followSide.current = 1;
      group.current.rotation.y = companion.current.rotation.y = heading.current;
      velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0);
      motion.current = companionMotion.current = 0;
      charPos.copy(group.current.position); companionPos.copy(companion.current.position);
    }
    if (endingFrozen(ending)) return;
    receiver.current.amount = giver.current.amount = 0; bouquet.current.visible = false;
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
      const gifting = kiss.mode === 'bouquet';
      const t = kiss.elapsed, approach = ease(t / 1.8), retreat = gifting ? ease((t - 8.3) / 1.5) : ease((t - 4.6) / 1.6);
      const faceYaw = Math.atan2(kiss.axis.x, kiss.axis.z);
      const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
      const pose = (actor: THREE.Group, origin: THREE.Vector3, yaw: number, side: number, targetYaw: number, speed: { current: number }) => {
        const oldX = actor.position.x, oldZ = actor.position.z;
        state.target.copy(kiss.center).addScaledVector(kiss.axis, side * (kiss.mode === 'photo' ? .5 : gifting ? .47 : .365));
        actor.position.lerpVectors(origin, state.target, approach).lerp(origin, retreat);
        actor.rotation.y = yaw + angle(targetYaw, yaw) * approach * (1 - retreat);
        speed.current = Math.hypot(actor.position.x - oldX, actor.position.z - oldZ) / Math.max(delta, .001);
      };
      const photoYaw = Math.atan2(-kiss.axis.z, kiss.axis.x);
      pose(group.current, state.player, state.playerYaw, -1, kiss.mode === 'photo' ? photoYaw + .06 : faceYaw, motion);
      pose(companion.current, state.partner, state.partnerYaw, 1, kiss.mode === 'photo' ? photoYaw - .06 : faceYaw + Math.PI, companionMotion);
      // Shared world-space grip points keep both pairs of hands together,
      // even when the couple faces a different direction in another room.
      kissHands.current.forEach((hand, index) => hand.copy(kiss.center).addScaledVector(
        state.target.set(kiss.axis.z, 0, -kiss.axis.x), index === 0 ? -.265 : .265,
      ).setY(.74));
      kissPose.current = kiss.mode === 'kiss' ? ease((t - 1.5) / .6) * (1 - ease((t - 4.2) / .5)) : 0;
      photoPose.current = kiss.mode === 'photo' ? ease((t - 1) / .8) * (1 - retreat) : 0;
      if (gifting) {
        const scratch = giftScratch.current, offer = ease((t - 2) / 1.4), accept = ease((t - 4) / 1.6);
        scratch.boy.set(0, .68, .31).applyAxisAngle(THREE.Object3D.DEFAULT_UP, companion.current.rotation.y).add(companion.current.position);
        scratch.girl.set(0, .68, .37).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(group.current.position);
        scratch.middle.copy(group.current.position).add(companion.current.position).multiplyScalar(.5).setY(.68);
        bouquet.current.position.copy(scratch.boy).lerp(scratch.middle, offer).lerp(scratch.girl, accept);
        bouquet.current.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, companion.current.rotation.y);
        scratch.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y);
        bouquet.current.rotation.slerp(scratch.rotation, accept); bouquet.current.visible = true;
        setGiftHands(companion.current, giver.current, 1 - ease((t - 4.4) / 1.4));
        setGiftHands(group.current, receiver.current, accept);
        if (t >= 5.6) kiss.bouquetReceived = true;
      }
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
    const chamber = museumRoomAt(startX);
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
      // Hold at the magical threshold briefly if the companion needs to catch up.
      if (Math.abs(p.z) < PASSAGE.width / 2) {
        const minX = chamber.index > 0 ? chamber.centerX - ROOM.width / 2 + 1.2 : -Infinity;
        const maxX = chamber.index < MUSEUM_ROOMS.length - 1 ? chamber.centerX + ROOM.width / 2 - 1.2 : Infinity;
        p.x = THREE.MathUtils.clamp(p.x, minX, maxX);
      }
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
    if (kiss.bouquetReceived) {
      bouquet.current.position.set(0, .68, .37).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(group.current.position);
      bouquet.current.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y); bouquet.current.visible = true;
      setGiftHands(group.current, receiver.current, 1);
    }
  }, -1);
  return <>
    <RoseBouquet pose={bouquet} />
    <group ref={group} name="player-girl" position={[0, 0, 4]}><Chibi ending={ending} variant="rose" giftGrip={receiver} poseSide={-1} motion={motion} kissPose={kissPose} kissHands={kissHands} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
    <group ref={companion} name="companion-boy" position={[1.05, 0, 3.78]}><Chibi ending={ending} variant="lavender" giftGrip={giver} poseSide={1} motion={companionMotion} kissPose={kissPose} kissHands={kissHands} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
  </>;
}


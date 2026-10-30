import { createHugPose, hugLean } from '../lib/hug';
import FootstepSparkles from './FootstepSparkles';
import { COUCH, createSittingPose } from '../lib/couch';
import type { CouchState } from '../lib/couch';
import { CAKE, constrainCakePosition, cakeCeremonyActive } from '../lib/cake';
import type { CakeState } from '../lib/cake';
import { constrainGardenPosition } from '../lib/gardenLayout';
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
import { createMomentPath, planMomentPath, sampleMomentPosition } from '../lib/momentPath';
import type { KissState } from '../lib/kiss';
import { constrainMuseumPosition, museumRoomAt, PASSAGE, MUSEUM_ROOMS } from '../lib/museumLayout';
import type { RoomTransitionState } from '../lib/roomTransition';
interface Props {
  suspended?: boolean; couch: CouchState; ending: EndingState; cake: CakeState; transition: RoomTransitionState; controls: ControlState; cameraState: CameraState; charPos: THREE.Vector3; companionPos: THREE.Vector3; kiss: KissState; reducedMotion?: boolean }
export default function Character({ suspended = false, couch, ending, cake, transition, controls, cameraState, charPos, companionPos, kiss, reducedMotion = false }: Props) {
  const group = useRef<THREE.Group>(null), companion = useRef<THREE.Group>(null);
  const couchWasActive = useRef(false), couchResting = useRef(false);
  const girlSit = useRef(createSittingPose()), boySit = useRef(createSittingPose());
  const couchPath = useRef(createMomentPath());
  const couchSaved = useRef({ sequence: 0, relocation: 0, girl: new THREE.Vector3(), boy: new THREE.Vector3(), girlYaw: 0, boyYaw: 0 });
  const velocity = useRef(new THREE.Vector3()), follow = useRef(new THREE.Vector3());
  const motion = useRef(0), companionMotion = useRef(0), heading = useRef(0);
  const followSide = useRef(1);
  const rejoiningFormation = useRef(false);
  const lastRelocation = useRef(0);
  const companionVelocity = useRef(new THREE.Vector3());
  const kissPose = useRef(0);
  const girlHug = useRef(createHugPose()), boyHug = useRef(createHugPose());
  const kissContact = useRef(new THREE.Vector3());
  const alignmentWaypoint = useRef(new THREE.Vector3());
  const wishEyes = useRef(0);
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
    if (suspended) return;
    if (!group.current || !companion.current) return;
    const delta = Math.min(frameDelta, .05);
    if (lastRelocation.current !== transition.relocation) {
      lastRelocation.current = transition.relocation;
      const direction = transition.direction, x = MUSEUM_ROOMS[transition.to].centerX - direction * (ROOM.width / 2 - 2.8);
      group.current.position.set(x, 0, direction * .44);
      companion.current.position.set(x - direction * .28, 0, -direction * .44);
      heading.current = direction * Math.PI / 2; followSide.current = 1; rejoiningFormation.current = false;
      group.current.rotation.y = companion.current.rotation.y = heading.current;
      velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0);
      motion.current = companionMotion.current = 0;
      charPos.copy(group.current.position); companionPos.copy(companion.current.position);
    }
    const cs = couchSaved.current;
    if (couch.cancelled) {
      if (cs.sequence && cs.relocation === transition.relocation && museumRoomAt(group.current.position.x).id === 'college') {
        group.current.position.copy(cs.girl); companion.current.position.copy(cs.boy);
        group.current.rotation.y = cs.girlYaw; companion.current.rotation.y = cs.boyYaw;
      }
      couch.cancelled = false; heading.current = group.current.rotation.y;
    }
    if (couch.phase !== 'idle') {
      couchWasActive.current = true; couchResting.current = false;
      if (cs.sequence !== couch.sequence) {
        cs.sequence = couch.sequence; cs.relocation = transition.relocation;
        cs.girl.copy(group.current.position); cs.boy.copy(companion.current.position);
        cs.girlYaw = group.current.rotation.y; cs.boyYaw = companion.current.rotation.y;
        const side = cs.boy.x >= cs.girl.x ? 1 : -1;
        planMomentPath(couchPath.current, cs.girl, cs.boy, new THREE.Vector3(COUCH.x, 0, COUCH.seatZ), new THREE.Vector3(side, 0, 0), .88);
      }
      const amount = couch.phase === 'seated' ? 1 : couch.phase === 'entering' ? ease(couch.elapsed / COUCH.seconds) : 1 - ease(couch.elapsed / COUCH.seconds);
      sampleMomentPosition(couchPath.current, amount, -1, group.current.position);
      sampleMomentPosition(couchPath.current, amount, 1, companion.current.position);
      group.current.position.y = (COUCH.hipY - .49 - .012) * amount;
      companion.current.position.y = (COUCH.hipY - .49 * 1.055 - .012) * amount;
      const turn = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
      group.current.rotation.y = cs.girlYaw + turn(Math.PI, cs.girlYaw) * amount;
      companion.current.rotation.y = cs.boyYaw + turn(Math.PI, cs.boyYaw) * amount;
      girlSit.current.amount = boySit.current.amount = amount;
      girlSit.current.holding = boySit.current.holding = couch.phase === 'seated';
      const side = cs.boy.x >= cs.girl.x ? 1 : -1;
      girlSit.current.hand.set(COUCH.x - side * .065, .94, COUCH.seatZ - .23);
      boySit.current.hand.set(COUCH.x + side * .065, .94, COUCH.seatZ - .23);
      velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0); motion.current = companionMotion.current = 0;
      kissPose.current = photoPose.current = 0; receiver.current.amount = giver.current.amount = 0; bouquet.current.visible = false;
      charPos.copy(group.current.position); companionPos.copy(companion.current.position);
      heading.current = group.current.rotation.y;
      couch.completed = couch.phase !== 'seated' && couch.elapsed === COUCH.seconds;
      return;
    }
    if (couchWasActive.current) { couchWasActive.current = false; couchResting.current = true; }
    girlSit.current.amount = boySit.current.amount = 0; girlSit.current.holding = boySit.current.holding = false;
    girlHug.current.amount = boyHug.current.amount = 0;
    kiss.pairDistance = group.current.position.distanceTo(companion.current.position);
    if (endingFrozen(ending)) return;
    receiver.current.amount = giver.current.amount = 0; bouquet.current.visible = false;
    if (kiss.active) {
      const state = saved.current;
      if (state.sequence !== kiss.sequence) {
        state.sequence = kiss.sequence;
        rejoiningFormation.current = false;
        state.player.copy(group.current.position); state.partner.copy(companion.current.position);
        state.playerYaw = group.current.rotation.y; state.partnerYaw = companion.current.rotation.y;
        kiss.center.copy(state.player).add(state.partner).multiplyScalar(.5);
        kiss.axis.copy(state.partner).sub(state.player).setY(0).normalize();
        if (kiss.mode === 'photo') {
          // Keep their existing places and choose the front nearest the camera.
          const front = Math.atan2(-kiss.axis.z, kiss.axis.x);
          if (Math.cos(front - cameraState.smoothedAzimuth) < 0) kiss.axis.negate();
        }
        // Resume following on the partner's original side after the return,
        // rather than immediately cutting across the player to a fixed side.
        followSide.current = (state.partner.x - state.player.x) * Math.cos(state.playerYaw) -
          (state.partner.z - state.player.z) * Math.sin(state.playerYaw) < 0 ? -1 : 1;
      }
      const gifting = kiss.mode === 'bouquet';
      const hugging = kiss.mode === 'hug';
      const t = kiss.elapsed, approach = ease(t / (hugging ? 1.5 : 1.8)), retreat = gifting ? 0 : hugging ? ease((t - 5.7) / 1.3) : ease((t - 4.6) / 1.6);
      const progress = approach * (1 - retreat);
      const faceYaw = Math.atan2(kiss.axis.x, kiss.axis.z);
      const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
      const pose = (actor: THREE.Group, yaw: number, side: number, targetYaw: number, speed: { current: number }) => {
        const oldX = actor.position.x, oldZ = actor.position.z;
        if (hugging) {
          const start = side < 0 ? state.player : state.partner;
          const gap = Math.min(.73, state.player.distanceTo(state.partner));
          state.target.copy(kiss.center).addScaledVector(kiss.axis, side * gap / 2);
          actor.position.lerpVectors(start, state.target, progress);
        }
        // Photo, kiss and gift scenes preserve the exact starting foot positions.
        actor.rotation.y = yaw + angle(targetYaw, yaw) * progress;
        speed.current = Math.hypot(actor.position.x - oldX, actor.position.z - oldZ) / Math.max(delta, .001);
      };
      const photoYaw = Math.atan2(-kiss.axis.z, kiss.axis.x);
      pose(group.current, state.playerYaw, -1, kiss.mode === 'photo' ? photoYaw + .06 : faceYaw, motion);
      pose(companion.current, state.partnerYaw, 1, kiss.mode === 'photo' ? photoYaw - .06 : faceYaw + Math.PI, companionMotion);
      // Shared world-space grip points keep both pairs of hands together,
      // even when the couple faces a different direction in another room.
      kissHands.current.forEach((hand, index) => hand.copy(kiss.center).addScaledVector(
        state.target.set(kiss.axis.z, 0, -kiss.axis.x), index === 0 ? -.265 : .265,
      ).setY(.74));
      kissContact.current.copy(kiss.center).setY(1.085);
      kissPose.current = kiss.mode === 'kiss' ? ease((t - 1.5) / .6) * (1 - ease((t - 4.2) / .5)) : 0;
      photoPose.current = kiss.mode === 'photo' ? ease((t - 1) / .8) * (1 - retreat) : 0;
      if (kiss.mode === 'hug') {
        const amount = ease((t - 1.6) / 1) * (1 - ease((t - 4.5) / 1.2));
        const gap = group.current.position.distanceTo(companion.current.position), lean = hugLean(gap) * amount;
        const embrace = (pose: typeof girlHug.current, partner: THREE.Group, partnerScale: number, height: number) => {
          pose.amount = amount; pose.gap = gap;
          for (const side of [-1, 1]) {
            const point = pose.hands[side < 0 ? 0 : 1];
            point.set(-side * .27, .012 + (.49 + (height - .49) * Math.cos(lean) - .07 * Math.sin(lean)) * partnerScale, (height - .49) * Math.sin(lean) + .07 * Math.cos(lean));
            point.applyAxisAngle(THREE.Object3D.DEFAULT_UP, partner.rotation.y).add(partner.position);
          }
        };
        embrace(girlHug.current, companion.current, 1.055, .76);
        embrace(boyHug.current, group.current, 1, .88);
      }
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
      if (!gifting && kiss.bouquetReceived) {
        bouquet.current.position.set(0, .68, .37).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(group.current.position);
        bouquet.current.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y); bouquet.current.visible = true;
        setGiftHands(group.current, receiver.current, 1);
      }
      velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0);
      charPos.copy(group.current.position);
      companionPos.copy(companion.current.position);
      return;
    }
    kissPose.current = 0;
    photoPose.current = 0;
    wishEyes.current = cake.eyesClosed;
    if (cakeCeremonyActive(cake)) {
      const actor = group.current, boy = companion.current;
      const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
      // The player already chose a clear spot within interaction range.
      // Only turn toward the cake; never auto-walk away from that spot.
      velocity.current.set(0, 0, 0); motion.current = 0;
      const yaw = Math.atan2(CAKE.position.x - actor.position.x, CAKE.position.z - actor.position.z);
      actor.rotation.y += angle(yaw, actor.rotation.y) * (1 - Math.exp(-9 * delta));
      if (cake.phase === 'aligning') {
        const radial = alignmentWaypoint.current.copy(actor.position).sub(CAKE.position).setY(0).normalize();
        if (!cake.alignmentPlanned) {
          const tx = radial.z, tz = -radial.x;
          const sign = (boy.position.x - actor.position.x) * tx + (boy.position.z - actor.position.z) * tz < 0 ? -1 : 1;
          cake.alignmentTarget.copy(actor.position).add(new THREE.Vector3(tx * sign, 0, tz * sign).multiplyScalar(1.08));
          constrainGardenPosition(cake.alignmentTarget);
          if (cake.alignmentTarget.distanceTo(actor.position) < 1.04 || cake.alignmentTarget.distanceTo(CAKE.position) < 1.02) {
            cake.alignmentTarget.copy(actor.position).add(new THREE.Vector3(-tx * sign, 0, -tz * sign).multiplyScalar(1.08));
            constrainGardenPosition(cake.alignmentTarget);
          }
          if (boy.position.distanceTo(actor.position) <= 1.3) { cake.alignmentTarget.copy(boy.position); cake.alignmentStage = 2; }
          cake.alignmentPlanned = true;
        }
        const destination = cake.alignmentTarget;
        const radius = Math.max(1.65, destination.distanceTo(CAKE.position) + .06);
        const currentRadius = boy.position.distanceTo(CAKE.position);
        const currentAngle = Math.atan2(boy.position.x - CAKE.position.x, boy.position.z - CAKE.position.z);
        const goalAngle = Math.atan2(destination.x - CAKE.position.x, destination.z - CAKE.position.z);
        const turn = angle(goalAngle, currentAngle);
        if (cake.alignmentStage === 0 && (currentRadius >= radius - .03 || cake.elapsed > .9)) cake.alignmentStage = 1;
        if (cake.alignmentStage === 1 && Math.abs(turn) < .02) cake.alignmentStage = 2;
        const next = cake.alignmentStage === 0 ? currentAngle : currentAngle + THREE.MathUtils.clamp(turn, -.20, .20);
        const waypoint = alignmentWaypoint.current;
        if (cake.alignmentStage === 2) waypoint.copy(destination);
        else waypoint.set(CAKE.position.x + Math.sin(next) * radius, 0, CAKE.position.z + Math.cos(next) * radius);
        companionVelocity.current.copy(waypoint).sub(boy.position);
        const gap = companionVelocity.current.length();
        companionVelocity.current.setLength(Math.min(.95, gap * 5));
        const oldX = boy.position.x, oldZ = boy.position.z;
        boy.position.addScaledVector(companionVelocity.current, delta);
        constrainCakePosition(boy.position); constrainGardenPosition(boy.position);
        waypoint.copy(boy.position).sub(actor.position);
        if (waypoint.length() < 1.04) boy.position.copy(actor.position).add(waypoint.setLength(1.04));
        companionMotion.current = Math.hypot(boy.position.x - oldX, boy.position.z - oldZ) / Math.max(delta, .001);
        cake.alignmentReady = cake.alignmentStage === 2 && boy.position.distanceTo(destination) < .025;
      } else { companionVelocity.current.set(0, 0, 0); companionMotion.current = 0; }
      const boyYaw = cake.phase === 'aligning' && companionMotion.current > .1
        ? Math.atan2(companionVelocity.current.x, companionVelocity.current.z)
        : Math.atan2(CAKE.position.x - boy.position.x, CAKE.position.z - boy.position.z);
      boy.rotation.y += angle(boyYaw, boy.rotation.y) * (1 - Math.exp(-9 * delta));
      cake.positioned = Math.abs(angle(yaw, actor.rotation.y)) < .06 && Math.abs(angle(boyYaw, boy.rotation.y)) < .06;
      heading.current = actor.rotation.y;
      charPos.copy(actor.position); companionPos.copy(boy.position);
      if (kiss.bouquetReceived) {
        bouquet.current.position.set(0, .68, .37).applyAxisAngle(THREE.Object3D.DEFAULT_UP, actor.rotation.y).add(actor.position);
        bouquet.current.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, actor.rotation.y); bouquet.current.visible = true;
        setGiftHands(actor, receiver.current, 1);
      }
      return;
    }
    if (couchResting.current) {
      if (transition.active || museumRoomAt(group.current.position.x).id !== 'college' || Math.hypot(controls.keyboardX, controls.keyboardY, controls.joystickX, controls.joystickY) > .08) couchResting.current = false;
      else {
        velocity.current.set(0, 0, 0); companionVelocity.current.set(0, 0, 0); motion.current = companionMotion.current = 0;
        charPos.copy(group.current.position); companionPos.copy(companion.current.position); return;
      }
    }
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
    const atCake = ending.phase === 'cake';
    const clamp = (p: THREE.Vector3) => {
      if (atCake) { constrainCakePosition(p); constrainGardenPosition(p); return; }
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
    if (atCake && !controls.paused) {
      // Resolve the two nearby solid objects together. At a tight contact,
      // reject only this input step rather than pushing her through the NPC.
      for (let pass = 0; pass < 5; pass++) {
        const dx = group.current.position.x - companion.current.position.x, dz = group.current.position.z - companion.current.position.z;
        const gap = Math.hypot(dx, dz);
        if (gap < 1.04 && gap > .0001) {
          group.current.position.x = companion.current.position.x + dx / gap * 1.04;
          group.current.position.z = companion.current.position.z + dz / gap * 1.04;
        }
        clamp(group.current.position);
      }
      if (group.current.position.distanceTo(companion.current.position) < 1.035 || group.current.position.distanceTo(CAKE.position) < CAKE.collisionRadius - .001) group.current.position.set(startX, 0, startZ);
    }
    // Remove velocity into walls while allowing motion along them.
    if ((requestedX - group.current.position.x) * velocity.current.x > .00001) velocity.current.x = 0;
    if ((requestedZ - group.current.position.z) * velocity.current.z > .00001) velocity.current.z = 0;
    charPos.copy(group.current.position);
    motion.current = Math.hypot(charPos.x - startX, charPos.z - startZ) / Math.max(delta, .001);
    if (atCake && (cake.phase === 'revealing' || cake.phase === 'walking')) {
      // Watch the reveal, then follow the invitation with her gaze only.
      const focus = cake.phase === 'walking' ? companion.current.position : CAKE.position;
      heading.current = Math.atan2(focus.x - charPos.x, focus.z - charPos.z);
    } else if (motion.current > .1) heading.current = Math.atan2(velocity.current.x, velocity.current.z);
    const angle = (a: number, b: number) => THREE.MathUtils.euclideanModulo(a - b + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += angle(heading.current, group.current.rotation.y) * (1 - Math.exp(-CHARACTER.rotationSpeed * delta));
    follow.current.set(.88 * followSide.current, 0, -.22).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(charPos);
    clamp(follow.current);
    if (follow.current.distanceToSquared(charPos) < .72 ** 2) {
      followSide.current *= -1;
      follow.current.set(.88 * followSide.current, 0, -.22).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(charPos);
      clamp(follow.current);
    }
    const playerRoom = museumRoomAt(charPos.x), partnerRoom = museumRoomAt(companion.current.position.x);
    if (playerRoom.index !== partnerRoom.index) {
      const direction = Math.sign(playerRoom.index - partnerRoom.index);
      // Enter the passage centrally so the partner cannot get caught on its jamb.
      const aligned = Math.abs(companion.current.position.z) < PASSAGE.width / 2 - 1;
      follow.current.set(partnerRoom.centerX + direction * (aligned ? ROOM.width / 2 + PASSAGE.length : ROOM.width / 2 - 1.2), 0, 0);
    }
    if (atCake) {
      rejoiningFormation.current = false;
      follow.current.copy(CAKE.npcPosition);
      if (cake.phase !== 'walking') follow.current.copy(companion.current.position);
      else {
        // Steer around the girl if she walks into his short invitation route.
        const dx = companion.current.position.x - charPos.x, dz = companion.current.position.z - charPos.z;
        const tx = follow.current.x - charPos.x, tz = follow.current.z - charPos.z;
        const vx = tx - dx, vz = tz - dz, lengthSq = vx * vx + vz * vz;
        const along = lengthSq > .0001 ? THREE.MathUtils.clamp(-(dx * vx + dz * vz) / lengthSq, 0, 1) : 0;
        if (along > 0 && Math.hypot(dx + along * vx, dz + along * vz) < 1.08) {
          const current = Math.atan2(dx, dz), target = Math.atan2(tx, tz);
          const next = current + Math.sign(angle(target, current) || 1) * .38;
          const radius = Math.max(1.14, Math.hypot(dx, dz));
          follow.current.set(charPos.x + Math.sin(next) * radius, 0, charPos.z + Math.cos(next) * radius);
        }
      }
    }
    if (rejoiningFormation.current) {
      if (companion.current.position.distanceTo(follow.current) < .04) rejoiningFormation.current = false;
      else {
        // Rejoin the walking formation around the player, never by taking a
        // chord through her when the original position was in front of her.
        const dx = companion.current.position.x - charPos.x, dz = companion.current.position.z - charPos.z;
        const currentAngle = Math.atan2(dx, dz);
        const targetAngle = Math.atan2(follow.current.x - charPos.x, follow.current.z - charPos.z);
        const nextAngle = currentAngle + THREE.MathUtils.clamp(angle(targetAngle, currentAngle), -.32, .32);
        const radius = Math.max(.92, THREE.MathUtils.lerp(Math.hypot(dx, dz), follow.current.distanceTo(charPos), .25));
        follow.current.set(charPos.x + Math.sin(nextAngle) * radius, 0, charPos.z + Math.cos(nextAngle) * radius);
        clamp(follow.current);
      }
    }
    const oldX = companion.current.position.x, oldZ = companion.current.position.z;
    follow.current.sub(companion.current.position);
    const distance = follow.current.length();
    const followSpeed = distance < .035 ? 0 : Math.min(atCake ? 1.15 : CHARACTER.speed * 1.35, distance * 4);
    follow.current.multiplyScalar(distance > 0 ? followSpeed / distance : 0);
    companionVelocity.current.lerp(follow.current, 1 - Math.exp(-10 * delta));
    if (atCake && (cake.phase === 'inviting' || cake.phase === 'finished')) companionVelocity.current.set(0, 0, 0);
    companion.current.position.addScaledVector(companionVelocity.current, delta);
    clamp(companion.current.position);
    companionMotion.current = Math.hypot(companion.current.position.x - oldX, companion.current.position.z - oldZ) / Math.max(delta, .001);
    const companionHeading = companionMotion.current > .12
      ? Math.atan2(companion.current.position.x - oldX, companion.current.position.z - oldZ)
      : atCake ? Math.atan2(charPos.x - companion.current.position.x, charPos.z - companion.current.position.z) : group.current.rotation.y;
    companion.current.rotation.y += angle(companionHeading, companion.current.rotation.y) * (1 - Math.exp(-9 * delta));
    companionPos.copy(companion.current.position);
    if (atCake && cake.phase === 'walking') {
      const facing = Math.atan2(charPos.x - companionPos.x, charPos.z - companionPos.z);
      cake.npcArrived = companionPos.distanceTo(CAKE.npcPosition) < .065 && companionMotion.current < .04 && Math.abs(angle(facing, companion.current.rotation.y)) < .08;
    }
    if (kiss.bouquetReceived) {
      bouquet.current.position.set(0, .68, .37).applyAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y).add(group.current.position);
      bouquet.current.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, group.current.rotation.y); bouquet.current.visible = true;
      setGiftHands(group.current, receiver.current, 1);
    }
  }, -1);
  return <>
    <FootstepSparkles position={charPos} motion={motion} enabled={!suspended && !reducedMotion && !controls.paused && !kiss.active && !endingFrozen(ending) && couch.phase === 'idle'} />
    <RoseBouquet pose={bouquet} />
    <group ref={group} name="player-girl" position={[0, 0, 4]}><Chibi hug={girlHug} suspended={suspended} sitting={girlSit} ending={ending} variant="rose" wishEyes={wishEyes} giftGrip={receiver} poseSide={-1} motion={motion} kissContact={kissContact} kissPose={kissPose} kissHands={kissHands} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
    <group ref={companion} name="companion-boy" position={[.88, 0, 3.78]}><Chibi hug={boyHug} suspended={suspended} sitting={boySit} ending={ending} variant="lavender" wishEyes={wishEyes} giftGrip={giver} poseSide={1} motion={companionMotion} kissContact={kissContact} kissPose={kissPose} kissHands={kissHands} photoPose={photoPose} reducedMotion={reducedMotion} /></group>
  </>;
}


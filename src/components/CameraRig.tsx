import { FLOWER_DURATION } from '../lib/earFlower';
import { HUG_DURATION } from '../lib/hug';
import { COUCH } from '../lib/couch';
import type { CouchState } from '../lib/couch';
import { CAKE, cakeCeremonyActive } from '../lib/cake';
import type { CakeState } from '../lib/cake';
import { endingFrozen, endingView, ENDING_PULLBACK_SECONDS } from '../lib/ending';
import type { EndingState, EndingPhase } from '../lib/ending';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ROOM, CAMERA } from '../config';
import type { CameraState } from '../controls';
import { BOUQUET_DURATION, ease } from '../lib/kiss';
import type { KissState } from '../lib/kiss';
import type { ExperienceSettings } from '../hooks/useExperienceSettings';
import { MUSEUM_BOUNDS, cameraWallDistance, constrainMuseumPosition, museumRoomAt } from '../lib/museumLayout';

import type { RoomTransitionState } from '../lib/roomTransition';
interface Props {
  suspended?: boolean; couch: CouchState; cake: CakeState; ending: EndingState; onEndingChange: (phase: EndingPhase) => void; transition: RoomTransitionState; cameraState: CameraState; charPos: THREE.Vector3; companionPos: THREE.Vector3; kiss: KissState; settings: ExperienceSettings }
export default function CameraRig({ suspended = false, couch, cake, ending, onEndingChange, transition, cameraState, charPos, companionPos, kiss, settings }: Props) {
  const { camera, gl, scene } = useThree();
  const dragPointerId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0, distance: 0, interactive: false });
  const smoothAzimuth = useRef(cameraState.azimuth), smoothPitch = useRef(cameraState.pitch);
  const anchor = useRef(new THREE.Vector3(0, 0, 4));
  const target = useMemo(() => new THREE.Vector3(), []), offset = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []), ray = useMemo(() => new THREE.Raycaster(), []);
  const obstacles = useRef<THREE.Object3D[]>([]), intersections = useRef<THREE.Intersection[]>([]);
  const orbitDistance = useRef(settings.distance);
  const lastRelocation = useRef(0);
  const finalAspect = useRef(0);
  const cakeShotStarted = useRef(false);
  const cakeFocus = useMemo(() => new THREE.Vector3(), []);
  const cakeBlend = useRef(0), cakeLookHeight = useRef(1.05);
  const profile = useRef({ distance: settings.distance, height: settings.lookHeight, pitch: settings.pitchOffset, compact: settings.compact ? 1 : 0 });
  const shot = useMemo(() => new THREE.PerspectiveCamera(), []);
  const shotTarget = useMemo(() => new THREE.Vector3(), []);
  const shotDistance = useRef(3.4);
  const flowerView = useRef({ sequence: -1, position: new THREE.Vector3(), rotation: new THREE.Quaternion(), azimuth: 0 });
  const bouquetView = useRef({ sequence: -1, azimuth: 0 });
  const pairOffset = useRef(new THREE.Vector3(.47, 0, -.15));
  const smoothOffset = useRef(new THREE.Vector3(0, 3, 4));

  useEffect(() => {
    obstacles.current = [];
    scene.traverse(o => { if (o.userData.cameraObstacle) obstacles.current.push(o); });
  }, [scene]);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (kiss.active || cameraState.inputLocked || dragPointerId.current !== null || e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const point = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      ray.far = Infinity;
      ray.setFromCamera(point, camera);
      // A touch starting on a photograph belongs to the photograph, not the orbit.
      const hit = ray.intersectObjects(scene.children, true).find(h => (h.object as THREE.Mesh).isMesh);
      dragPointerId.current = e.pointerId;
      last.current = { x: e.clientX, y: e.clientY, distance: 0, interactive: Boolean(hit?.object.userData.interactivePhoto || hit?.object.parent?.userData.interactivePhoto || hit?.object.userData.interactiveCouch || hit?.object.parent?.userData.interactiveCouch) };
    };
    const move = (e: PointerEvent) => {
      if (kiss.active || cameraState.inputLocked) { dragPointerId.current = null; return; }
      if (dragPointerId.current !== e.pointerId) return;
      const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
      last.current.x = e.clientX; last.current.y = e.clientY;
      last.current.distance += Math.hypot(dx, dy);
      if (last.current.distance < CAMERA.dragThreshold) return;
      cameraState.suppressPhotoClickUntil = performance.now() + 250;
      if (last.current.interactive) return;
      if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
      cameraState.azimuth -= dx * CAMERA.rotationSensitivity;
      cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + dy * CAMERA.pitchSensitivity, CAMERA.minPitch, CAMERA.maxPitch);
      e.preventDefault();
    };
    const up = (e: PointerEvent) => {
      if (dragPointerId.current !== e.pointerId) return;
      if (last.current.distance >= CAMERA.dragThreshold) cameraState.suppressPhotoClickUntil = performance.now() + 250;
      dragPointerId.current = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const blur = () => {
      const pointer = dragPointerId.current;
      dragPointerId.current = null;
      if (pointer !== null && el.hasPointerCapture(pointer)) el.releasePointerCapture(pointer);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    window.addEventListener('blur', blur);
    window.addEventListener('resize', blur);
    window.addEventListener('orientationchange', blur);
    document.addEventListener('fullscreenchange', blur);
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('blur', blur); window.removeEventListener('resize', blur); window.removeEventListener('orientationchange', blur); document.removeEventListener('fullscreenchange', blur); };
  }, [camera, cameraState, gl, kiss, ray, scene]);

  useFrame((_, frameDelta) => {
    if (suspended) return;
    const delta = Math.min(frameDelta, .05);
    if (!cake.acknowledged) { cakeShotStarted.current = false; }
    if (cakeCeremonyActive(cake) && !cakeShotStarted.current) {
      cakeShotStarted.current = true;
      // Look from the cake side of the pair, where their faces turn inward.
      const girlDistance = Math.max(.001, charPos.distanceTo(CAKE.position));
      const boyDistance = Math.max(.001, companionPos.distanceTo(CAKE.position));
      const dx = (CAKE.position.x - charPos.x) / girlDistance + (CAKE.position.x - companionPos.x) / boyDistance;
      const dz = (CAKE.position.z - charPos.z) / girlDistance + (CAKE.position.z - companionPos.z) / boyDistance;
      const view = Math.hypot(dx, dz) > .15 ? Math.atan2(dx, dz) : Math.atan2(-(companionPos.z - charPos.z), companionPos.x - charPos.x);
      const turn = THREE.MathUtils.euclideanModulo(view - smoothAzimuth.current + Math.PI, Math.PI * 2) - Math.PI;
      cameraState.azimuth = smoothAzimuth.current + turn;
      cameraState.pitch = .20;
    }
    const turningSpeed = cakeCeremonyActive(cake) ? 1.4 : 12;
    smoothAzimuth.current = THREE.MathUtils.damp(smoothAzimuth.current, cameraState.azimuth, turningSpeed, delta);
    smoothPitch.current = THREE.MathUtils.damp(smoothPitch.current, cameraState.pitch, 12, delta);
    cameraState.smoothedAzimuth = smoothAzimuth.current;
  }, -2);

  useFrame((_, frameDelta) => {
    if (suspended) return;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const flowering = kiss.active && kiss.mode === 'flower';
    if (flowering && flowerView.current.sequence !== kiss.sequence) {
      const view = flowerView.current;
      view.sequence = kiss.sequence;
      view.position.copy(camera.position); view.rotation.copy(camera.quaternion);
      const facing = Math.atan2(companionPos.x - charPos.x, companionPos.z - charPos.z);
      const side = Math.sin(smoothAzimuth.current - facing) < 0 ? -1 : 1;
      view.azimuth = facing + side * Math.PI / 2;
    }
    if (ending.phase !== 'exploring') {
      if (perspectiveCamera.far !== 180) { perspectiveCamera.far = 180; perspectiveCamera.updateProjectionMatrix(); }
    }
    if (flowering) {
      // One camera owns this scene. Blend directly from/to the exact saved view,
      // rather than mixing it with the moving follow camera every frame.
      const t = kiss.elapsed, aspect = perspectiveCamera.aspect || 1;
      const room = museumRoomAt(charPos.x);
      const fov = THREE.MathUtils.damp(perspectiveCamera.fov, settings.fov, 6, Math.min(frameDelta, .05));
      perspectiveCamera.fov = fov; perspectiveCamera.updateProjectionMatrix();
      const distance = Math.max(3.2, 1.85 / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect));
      shotTarget.copy(charPos).lerp(companionPos, .43).setY(1.12);
      shot.position.set(shotTarget.x + Math.sin(flowerView.current.azimuth) * distance, 1.65, shotTarget.z + Math.cos(flowerView.current.azimuth) * distance);
      shot.position.x = THREE.MathUtils.clamp(shot.position.x, room.centerX - ROOM.width / 2 + CAMERA.wallMargin, room.centerX + ROOM.width / 2 - CAMERA.wallMargin);
      shot.position.z = THREE.MathUtils.clamp(shot.position.z, MUSEUM_BOUNDS.minZ + CAMERA.wallMargin, MUSEUM_BOUNDS.maxZ - CAMERA.wallMargin);
      shot.lookAt(shotTarget);
      const amount = ease(t / 1.3) * (1 - ease((t - FLOWER_DURATION + 1.4) / 1.4));
      camera.position.lerpVectors(flowerView.current.position, shot.position, amount);
      camera.quaternion.slerpQuaternions(flowerView.current.rotation, shot.quaternion, amount);
      anchor.current.copy(charPos);
      return;
    }
    if (endingFrozen(ending)) {
      // Capture once. After the reveal, no orbit, damping or idle camera work runs.
      if (!ending.cameraCaptured) {
        ending.center.copy(charPos).add(companionPos).multiplyScalar(.5);
        ending.cameraCaptured = true; ending.cameraPosition.copy(camera.position); ending.cameraRotation.copy(camera.quaternion); ending.cameraFov = perspectiveCamera.fov;
      }
      if (ending.phase === 'complete' && finalAspect.current === perspectiveCamera.aspect) return;
      const center = target.copy(charPos).add(companionPos).multiplyScalar(.5);
      const view = endingView(perspectiveCamera.aspect || 1, center, ending.azimuth);
      const duration = settings.reducedMotion ? .8 : ENDING_PULLBACK_SECONDS;
      const t = ending.phase === 'complete' ? 1 : ease((performance.now() - ending.startedAt) / (duration * 1000));
      camera.position.lerpVectors(ending.cameraPosition, view.position, t);
      shot.position.copy(view.position); shot.lookAt(view.target);
      camera.quaternion.slerpQuaternions(ending.cameraRotation, shot.quaternion, t);
      perspectiveCamera.fov = THREE.MathUtils.lerp(ending.cameraFov, view.fov, t);
      // Shift the composition down without tilting farther towards the ground.
      // Blend the lens shift with the existing single cinematic pullback.
      perspectiveCamera.setViewOffset(perspectiveCamera.aspect * 1000, 1000, 0, view.shiftY * 1000 * t, perspectiveCamera.aspect * 1000, 1000);
      finalAspect.current = perspectiveCamera.aspect;
      if (t === 1 && ending.phase !== 'complete') { ending.phase = 'complete'; onEndingChange('complete'); }
      return;
    }
    const exterior = ending.phase === 'cake' || (kiss.active && kiss.mode === 'bouquet');
    const dt = Math.min(frameDelta, .05), p = profile.current;
    if (lastRelocation.current !== transition.relocation) {
      lastRelocation.current = transition.relocation; anchor.current.copy(charPos);
      pairOffset.current.copy(companionPos).sub(charPos).multiplyScalar(.45);
    }
    const ceremony = cakeCeremonyActive(cake);
    const halfHorizontalFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(settings.fov / 2)) * perspectiveCamera.aspect);
    const ceremonyDistance = Math.max(cake.phase === 'constellation' || cake.phase === 'heartHold' ? 5.8 : 4.4, (charPos.distanceTo(companionPos) * .5 + .65) / Math.sin(halfHorizontalFov));
    p.distance = THREE.MathUtils.damp(p.distance, ceremony ? ceremonyDistance : ending.phase === 'cake' ? (settings.phone && settings.portrait ? 5.5 : settings.compact ? 6.2 : 6.8) : settings.distance, 5, dt);
    p.height = THREE.MathUtils.damp(p.height, settings.lookHeight, 5, dt);
    p.pitch = THREE.MathUtils.damp(p.pitch, settings.pitchOffset, 5, dt);
    p.compact = THREE.MathUtils.damp(p.compact, settings.compact ? 1 : 0, 5, dt);
    anchor.current.lerp(charPos, 1 - Math.exp(-12 * dt));
    desired.copy(companionPos).sub(charPos).multiplyScalar(.45).clampLength(0, .65);
    pairOffset.current.lerp(desired, 1 - Math.exp(-8 * dt));
    const az = smoothAzimuth.current, sin = Math.sin(az), cos = Math.cos(az);
    // Aim slightly above and ahead of the feet, leaving the pair below center.
    target.copy(anchor.current); target.y += p.height;
    target.x += (pairOffset.current.x - sin * .35) * p.compact;
    target.z += (pairOffset.current.z - cos * .35) * p.compact;
    cakeBlend.current = THREE.MathUtils.damp(cakeBlend.current, ceremony ? 1 : 0, 3, dt);
    cakeFocus.copy(charPos).add(companionPos).multiplyScalar(.5); cakeLookHeight.current = THREE.MathUtils.damp(cakeLookHeight.current, cake.phase === 'constellation' || cake.phase === 'heartHold' ? 2 : 1.05, 2, dt); cakeFocus.y = cakeLookHeight.current;
    target.lerp(cakeFocus, cakeBlend.current);
    const minX = MUSEUM_BOUNDS.minX + CAMERA.wallMargin, maxX = MUSEUM_BOUNDS.maxX - CAMERA.wallMargin;
    const minZ = MUSEUM_BOUNDS.minZ + CAMERA.wallMargin, maxZ = MUSEUM_BOUNDS.maxZ - CAMERA.wallMargin;
    if (!exterior) constrainMuseumPosition(target, .3);
    const pitch = THREE.MathUtils.clamp(smoothPitch.current + p.pitch, .15 + p.compact * .15, 1.35);
    const horizontal = exterior ? p.distance * Math.cos(pitch) : cameraWallDistance(target, sin, cos, p.distance * Math.cos(pitch));
    const ceiling = exterior ? Infinity : CAMERA.maxY - target.y;
    const height = Math.min(ceiling, Math.max(p.distance * Math.sin(pitch), p.compact * Math.sqrt(Math.max(0, p.distance ** 2 - horizontal ** 2))));
    offset.set(sin * horizontal, height, cos * horizontal);
    let available = offset.length();
    offset.normalize();
    ray.set(target, offset); ray.far = available + .3;
    intersections.current.length = 0;
    if (!exterior) ray.intersectObjects(obstacles.current, true, intersections.current);
    if (intersections.current.length) available = Math.max(.2, Math.min(available, intersections.current[0].distance - .3));
    orbitDistance.current = available < orbitDistance.current ? available : THREE.MathUtils.damp(orbitDistance.current, available, 6, dt);
    desired.copy(target).addScaledVector(offset, orbitDistance.current);
    // Smooth elevation/orientation changes while enforcing room bounds immediately.
    smoothOffset.current.lerp(desired.sub(target), 1 - Math.exp(-14 * dt));
    camera.position.copy(target).add(smoothOffset.current);
    if (!exterior) {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    }
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, CAMERA.minY, exterior ? 12 : CAMERA.maxY);
    // Check the interpolated position too: a smooth orbit must not cut through a vase.
    offset.copy(camera.position).sub(target);
    const actualDistance = offset.length();
    if (actualDistance > .001) {
      ray.set(target, offset.divideScalar(actualDistance)); ray.far = actualDistance + .3;
      intersections.current.length = 0;
      if (!exterior) ray.intersectObjects(obstacles.current, true, intersections.current);
      if (intersections.current.length && intersections.current[0].distance < actualDistance + .3) camera.position.copy(target).addScaledVector(offset, Math.max(.2, intersections.current[0].distance - .3));
    }
    camera.lookAt(target);
    const perspective = camera as THREE.PerspectiveCamera;
    const nextFov = THREE.MathUtils.damp(perspective.fov, settings.fov, 6, dt);
    if (Math.abs(nextFov - perspective.fov) > .005) { perspective.fov = nextFov; perspective.updateProjectionMatrix(); }
    if (couch.phase !== 'idle') {
      const blend = couch.phase === 'seated' ? 1 : couch.phase === 'entering' ? ease(couch.elapsed / COUCH.seconds) : 1 - ease(couch.elapsed / COUCH.seconds);
      const distance = Math.max(4.2, 3.65 / (2 * Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2)) * perspective.aspect));
      shotTarget.set(COUCH.x, 1.2, COUCH.seatZ);
      shot.position.set(COUCH.x + .75, 2.1, COUCH.seatZ - distance); shot.lookAt(shotTarget);
      if (couch.phase === 'seated') { camera.position.copy(shot.position); camera.quaternion.copy(shot.quaternion); }
      else { camera.position.lerp(shot.position, blend); camera.quaternion.slerp(shot.quaternion, blend); }
    }
    if (kiss.active && ending.phase !== 'cake') {
      const t = kiss.elapsed;
      const gifting = kiss.mode === 'bouquet';
      const hugging = kiss.mode === 'hug';
      const blend = hugging ? ease(t / 1.5) * (1 - ease((t - HUG_DURATION + 1.4) / 1.4)) : ease(t / (gifting ? 1.1 : 1.8)) * (1 - ease((t - (gifting ? BOUQUET_DURATION - 1 : 6.2)) / (gifting ? 1 : 2)));
      // Settle once beside the pair, then hold throughout the handoff.
      // Normal controls resume from this same side without a return swing.
      if (gifting && bouquetView.current.sequence !== kiss.sequence) {
        const side = Math.atan2(-kiss.axis.z, kiss.axis.x);
        let turn = THREE.MathUtils.euclideanModulo(side - smoothAzimuth.current + Math.PI, Math.PI * 2) - Math.PI;
        if (Math.abs(turn) > Math.PI / 2) turn += turn > 0 ? -Math.PI : Math.PI;
        const azimuth = smoothAzimuth.current + turn;
        bouquetView.current = { sequence: kiss.sequence, azimuth };
        cameraState.azimuth = azimuth;
      }
      const orbit = gifting ? bouquetView.current.azimuth : Math.atan2(-kiss.axis.z, kiss.axis.x) + (settings.reducedMotion || (kiss.mode !== 'kiss' && !hugging) ? 0 : .22 * Math.sin(t * .55));
      const aspect = perspective.aspect || 1;
      // Keep the couple and bouquet fully visible without rotating the shot.
      const desiredDistance = gifting
        ? Math.max(4.6, 2.6 / (2 * Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2)) * aspect))
        : Math.min(5.4, Math.max(kiss.mode === 'photo' ? 3.4 : 2.8, 2.2 / aspect));
      shotDistance.current = THREE.MathUtils.damp(shotDistance.current, desiredDistance, 6, dt);
      const distance = shotDistance.current;
      const room = museumRoomAt(kiss.center.x);
      shotTarget.copy(kiss.center); shotTarget.y = gifting ? 1.0 : 1.08;
      shot.position.set(kiss.center.x + Math.sin(orbit) * distance, gifting ? 2.45 : 1.85, kiss.center.z + Math.cos(orbit) * distance);
      // The bouquet happens on the open island; indoor walls must not flatten
      // its circular camera path. Kiss/photo scenes retain their room bounds.
      if (!gifting) {
        shot.position.x = THREE.MathUtils.clamp(shot.position.x, room.centerX - ROOM.width / 2 + CAMERA.wallMargin, room.centerX + ROOM.width / 2 - CAMERA.wallMargin);
        shot.position.z = THREE.MathUtils.clamp(shot.position.z, minZ, maxZ);
      }
      shot.lookAt(shotTarget);
      camera.position.lerp(shot.position, blend);
      camera.quaternion.slerp(shot.quaternion, blend);
    }
    if (transition.active && !settings.reducedMotion) {
      camera.position.lerp(target, .035 * Math.sin(Math.PI * transition.elapsed / 2.6));
    }
  });
  return null;
}

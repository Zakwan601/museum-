import LittleUniverse from './LittleUniverse';
import { CAKE } from '../lib/cake';
import type { CakeState } from '../lib/cake';
import type { EndingState, EndingPhase } from '../lib/ending';
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Gallery from './Gallery';
import Bookshelf from './Bookshelf';
import { BOOKS } from '../lib/books';
import IndoorGalleries from './IndoorGalleries';
import PhotoFrame from './PhotoFrame';
import Character from './Character';
import CameraRig from './CameraRig';
import { PHOTOS, ROOM } from '../config';
import type { ControlState, CameraState } from '../controls';
import type { PhotoConfig } from '../config';
import { KISS_DURATION, BOUQUET_DURATION } from '../lib/kiss';
import type { KissState } from '../lib/kiss';
import type { ExperienceSettings } from '../hooks/useExperienceSettings';
import RoomStructure from './RoomStructure';
import MagicArchway from './MagicArchway';
import { ROOM_PORTALS, ROOM_TRANSITION_DURATION } from '../lib/roomTransition';
import type { RoomPortal, RoomTransitionState } from '../lib/roomTransition';
import { ease } from '../lib/kiss';
import { museumRoomAt, MUSEUM_ROOMS } from '../lib/museumLayout';
import type { MuseumRoom } from '../lib/museumLayout';

const EXHIBITS = [...PHOTOS, ...BOOKS];

interface Props {
  ending: EndingState;
  cake: CakeState;
  onCakeChange: () => void;
  memories: PhotoConfig[];
  onEndingChange: (phase: EndingPhase) => void;
  transition: RoomTransitionState;
  simpleTransitions: boolean;
  onPortalEnter: (portal: RoomPortal) => void;
  onTransitionComplete: () => void;
  controls: ControlState;
  cameraState: CameraState;
  onPhotoClick: (photo: PhotoConfig) => void;
  nearbyPhoto: PhotoConfig | null;
  onNearbyPhotoChange: (photo: PhotoConfig | null) => void;
  kiss: KissState;
  onKissComplete: () => void;
  onBouquetStart: () => boolean;
  settings: ExperienceSettings;
  onRoomChange: (room: MuseumRoom) => void;
}

export default function Scene({ ending, cake, onCakeChange, memories, onEndingChange, transition, simpleTransitions, onPortalEnter, onTransitionComplete, controls, cameraState, onPhotoClick, nearbyPhoto, onNearbyPhotoChange, kiss, onKissComplete, onBouquetStart, settings, onRoomChange }: Props) {
  const charPos = useMemo(() => new THREE.Vector3(0, 0, 4), []);
  const companionPos = useMemo(() => new THREE.Vector3(1.05, 0, 3.78), []);
  const lastNearbyId = useRef<string | null>(null);
  const currentRoomId = useRef('school');
  const futureWelcomePlayed = useRef(false);
  const lastPortalId = useRef<string | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  useFrame((_, delta) => {
    transition.cooldown = Math.max(0, transition.cooldown - Math.min(delta, .2));
    if (!transition.active) return;
    transition.elapsed = Math.min(ROOM_TRANSITION_DURATION, Math.max(0, (performance.now() - transition.startedAt) / 1000));
    const t = transition.elapsed;
    const opacity = t < 1.1 ? ease(t / 1.1) : t < 1.45 ? 1 : 1 - ease((t - 1.45) / 1.15);
    if (transition.overlay) {
      transition.overlay.style.opacity = String(opacity);
      transition.overlay.style.backgroundColor = ['#2e2030', '#1b2235', '#352a22', '#2a2134'][transition.to];
    }
    if (t >= 1.25 && !transition.transferred) {
      transition.transferred = true; transition.relocation += 1;
      // Even a dropped frame must never reveal the character relocation.
      if (transition.overlay) transition.overlay.style.opacity = '1';
      return;
    }
    if (t >= ROOM_TRANSITION_DURATION) {
      transition.active = false; transition.cooldown = 2; transition.ready = null;
      if (transition.overlay) transition.overlay.style.opacity = '0';
      onTransitionComplete();
    }
  }, -4);

  useFrame((_, delta) => {
    if (!kiss.active) return;
    if (kiss.mode === 'photo' && kiss.returning && kiss.elapsed >= 2.4 && kiss.elapsed < 4.6) kiss.elapsed = 4.6;
    const duration = kiss.mode === 'bouquet' ? BOUQUET_DURATION : KISS_DURATION;
    const limit = kiss.mode === 'photo' && !kiss.returning ? 2.4 : duration;
    kiss.elapsed = Math.min(limit, kiss.elapsed + Math.min(delta, .05));
    if (kiss.elapsed >= duration) {
      kiss.active = false;
      if (kiss.mode === 'bouquet' && futureWelcomePlayed.current) {
        // Keep the existing finale available for a later ceremony stage.
        // Step one ends with a player-led approach to the cake.
        cake.phase = 'revealing'; cake.elapsed = 0; cake.reveal = 0;
        ending.startedAt = performance.now();
        // Restore a clear three-quarter view before handing control back.
        cameraState.azimuth = Math.atan2(charPos.x - CAKE.position.x, charPos.z - CAKE.position.z) - .35; cameraState.pitch = .35;
        onCakeChange(); onEndingChange('cake');
      }
      onKissComplete();
    }
  }, -3);

  useFrame((_, delta) => {
    if (ending.phase !== 'cake') return;
    if (cake.phase === 'revealing') {
      cake.elapsed = Math.min(CAKE.revealSeconds, cake.elapsed + Math.min(delta, .05));
      cake.reveal = ease(cake.elapsed / CAKE.revealSeconds);
      if (cake.elapsed === CAKE.revealSeconds) { cake.phase = 'walking'; onCakeChange(); }
    } else if (cake.phase === 'walking' && cake.npcArrived) {
      cake.phase = 'inviting'; onCakeChange();
    }
    const nearby = cake.phase === 'inviting' && charPos.distanceTo(CAKE.position) < CAKE.interactionRange + (cake.nearby ? .18 : 0);
    if (nearby !== cake.nearby) { cake.nearby = nearby; onCakeChange(); }
  }, -2.5);

  useFrame(() => {
    // The expanded exterior is independent of the indoor room coordinate grid.
    const room = ending.phase === 'cake' ? MUSEUM_ROOMS[3] : museumRoomAt(charPos.x);
    if (room.id !== currentRoomId.current && Math.abs(charPos.x - room.centerX) < ROOM.width / 2 - .2) {
      currentRoomId.current = room.id;
      onRoomChange(room);
      setActiveRoomIndex(room.index);
    }
    // Wait until both characters have cleared the arch, then play once per visit.
    if (!futureWelcomePlayed.current && room.index === 3 && charPos.x > room.centerX - ROOM.width / 2 + .35 && companionPos.x > room.centerX - ROOM.width / 2 + .35 && !kiss.active && !transition.active) {
      futureWelcomePlayed.current = onBouquetStart();
    }
    let portal: RoomPortal | null = null;
    if (room.index < 3 && ending.phase === 'exploring' && !transition.active && !kiss.active && transition.cooldown === 0) {
      portal = ROOM_PORTALS.find(p => p.from === room.index && Math.abs(charPos.z) < 1.8 && Math.abs(companionPos.z) < 1.8 &&
        Math.hypot(charPos.x - p.x, charPos.z) < (lastPortalId.current === p.id ? 3.8 : 3.4) &&
        Math.hypot(companionPos.x - p.x, companionPos.z) < (lastPortalId.current === p.id ? 3.8 : 3.4)) ?? null;
    }
    transition.ready = portal;
    lastPortalId.current = portal?.id ?? null;
    // Walking into the threshold starts the same cinematic, with no extra tap.
    // The wider readiness range lets the companion catch up beside the player.
    if (portal && !controls.paused && Math.abs(charPos.x - portal.x) <= 1.4 && Math.abs(charPos.z) < 1.5) {
      onPortalEnter(portal);
    }
    let nearest: PhotoConfig | null = null;
    let nearestDistance = Infinity;
    for (const photo of EXHIBITS) {
      // A wall or connecting passage must not activate a photo in another room.
      if ((photo.roomIndex ?? 0) !== room.index || Math.abs(charPos.x - room.centerX) > ROOM.width / 2 - .3) continue;
      const distance = Math.hypot(charPos.x - photo.position[0], charPos.z - photo.position[2]);
      // A little extra exit distance keeps the prompt stable at its boundary.
      const range = photo.id === lastNearbyId.current ? 2.8 : 2.4;
      if (distance < range && distance < nearestDistance) {
        nearest = photo;
        nearestDistance = distance;
      }
    }
    if ((nearest?.id ?? null) !== lastNearbyId.current) {
      lastNearbyId.current = nearest?.id ?? null;
      onNearbyPhotoChange(nearest);
    }
  });

  return (
    <>
      <group visible={activeRoomIndex !== 3}>
      <RoomStructure />
      {ROOM_PORTALS.filter(portal => portal.from < 3).map(portal => <MagicArchway key={portal.id} portal={portal} transition={transition} compact={settings.compact} reducedMotion={settings.reducedMotion} simple={simpleTransitions} />)}
      <Gallery settings={settings} charPos={charPos} />
      <Bookshelf charPos={charPos} compact={settings.compact} nearbyId={!kiss.active ? nearbyPhoto?.id ?? null : null} onOpen={book => { if (!kiss.active && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onPhotoClick(book); }} />
      <IndoorGalleries compact={settings.compact} activeRoomIndex={activeRoomIndex} />
      {PHOTOS.map((photo) => (
        <PhotoFrame key={photo.id} photo={photo} compact={settings.compact} reducedMotion={settings.reducedMotion} nearby={!kiss.active && nearbyPhoto?.id === photo.id} onClick={() => { if (!kiss.active && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onPhotoClick(photo); }} />
      ))}
      </group>
      {activeRoomIndex === 3 && <LittleUniverse ending={ending} cake={cake} memories={memories} compact={settings.compact} reducedMotion={settings.reducedMotion} simple={simpleTransitions} onPhotoClick={onPhotoClick} />}
      <Character ending={ending} cake={cake} transition={transition} controls={controls} cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} reducedMotion={settings.reducedMotion} />
      <CameraRig ending={ending} onEndingChange={onEndingChange} transition={transition} cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} settings={settings} />
    </>
  );
}

import { HUG_DURATION } from '../lib/hug';
import SecretEnvelope from './SecretEnvelope';
import { COUCH } from '../lib/couch';
import type { CouchState } from '../lib/couch';
import LittleUniverse from './LittleUniverse';
import { CAKE, cakeCeremonyActive } from '../lib/cake';
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
import KissParticles from './KissParticles';
import HeartConstellation from './HeartConstellation';
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
  letterOpen: boolean; onLetterNearby: (nearby: boolean) => void; onLetterOpen: () => void;
  couch: CouchState; onCouchChange: () => void; onCouchStart: () => void;
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
  onCakeKissStart: () => boolean;
  settings: ExperienceSettings;
  onRoomChange: (room: MuseumRoom) => void;
}

export default function Scene({ letterOpen, onLetterNearby, onLetterOpen, couch, onCouchChange, onCouchStart, ending, cake, onCakeChange, memories, onEndingChange, transition, simpleTransitions, onPortalEnter, onTransitionComplete, controls, cameraState, onPhotoClick, nearbyPhoto, onNearbyPhotoChange, kiss, onKissComplete, onBouquetStart, onCakeKissStart, settings, onRoomChange }: Props) {
  const charPos = useMemo(() => new THREE.Vector3(0, 0, 4), []);
  const companionPos = useMemo(() => new THREE.Vector3(.88, 0, 3.78), []);
  const lastNearbyId = useRef<string | null>(null);
  const currentRoomId = useRef('school');
  const futureWelcomePlayed = useRef(false);
  const lastPortalId = useRef<string | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  useFrame((_, delta) => {
    const inRoom = museumRoomAt(charPos.x).id === 'college';
    if ((!inRoom || transition.active || kiss.active || ending.phase !== 'exploring') && couch.phase !== 'idle') {
      couch.cancelled = true; couch.phase = 'idle'; couch.elapsed = 0; couch.nearby = false; onCouchChange();
    }
    if (couch.phase === 'entering' || couch.phase === 'leaving') {
      couch.elapsed = Math.min(COUCH.seconds, couch.elapsed + Math.min(delta, .05));
      if (couch.completed) { couch.phase = couch.phase === 'entering' ? 'seated' : 'idle'; couch.completed = false; onCouchChange(); }
    }
    const nearby = inRoom && !transition.active && !kiss.active && ending.phase === 'exploring' && couch.phase === 'idle' && charPos.z < 2.65 && companionPos.z < 2.75 && Math.hypot(charPos.x - COUCH.x, charPos.z - 1.95) < 1.65;
    if (nearby !== couch.nearby) { couch.nearby = nearby; onCouchChange(); }
  }, -2.6);

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
    const duration = kiss.mode === 'bouquet' ? BOUQUET_DURATION : kiss.mode === 'hug' ? HUG_DURATION : KISS_DURATION;
    const limit = kiss.mode === 'photo' && !kiss.returning ? 2.4 : duration;
    kiss.elapsed = Math.min(limit, kiss.elapsed + Math.min(delta, .05));
    if (kiss.elapsed >= duration) {
      kiss.active = false;
      if (kiss.mode === 'bouquet' && futureWelcomePlayed.current) {
        // Keep the existing finale available for a later ceremony stage.
        // Step one ends with a player-led approach to the cake.
        cake.phase = 'walking'; cake.elapsed = 0; cake.reveal = 0;
        ending.startedAt = performance.now();
        // Keep the bouquet's viewing direction when exploration resumes.
        // The ceremony chooses its face-facing angle only after the wish tap.
        onCakeChange(); onEndingChange('cake');
      }
      if (kiss.mode === 'kiss' && cake.phase === 'kissing') { cake.phase = 'constellation'; cake.elapsed = 0; onCakeChange(); }
      onKissComplete();
    }
  }, -3);

  useFrame((_, delta) => {
    if (ending.phase !== 'cake') return;
    // Reveal the cake while he walks, without a separate waiting beat.
    if (cake.phase === 'revealing') { cake.phase = 'walking'; onCakeChange(); }
    if (cake.phase === 'walking') {
      cake.elapsed = Math.min(CAKE.revealSeconds, cake.elapsed + Math.min(delta, .05));
      cake.reveal = ease(cake.elapsed / CAKE.revealSeconds);
      if (cake.npcArrived && cake.reveal === 1) { cake.phase = 'inviting'; onCakeChange(); }
    }
    if (cakeCeremonyActive(cake)) {
      cake.elapsed += Math.min(delta, .05);
      const advance = (phase: typeof cake.phase) => { cake.phase = phase; cake.elapsed = 0; onCakeChange(); };
      if (cake.phase === 'positioning' && cake.positioned) advance('lighting');
      if (cake.phase === 'lighting') {
        cake.lit = Math.min(3, Math.floor(cake.elapsed / .65));
        cake.flame = Math.min(1, cake.elapsed * 2);
        if (cake.elapsed >= 2.6) advance('wish');
      } else if (cake.phase === 'wish' && cake.elapsed >= 4 && !cake.canBlow) {
        cake.canBlow = true; onCakeChange();
      } else if (cake.phase === 'blowing') {
        cake.eyesClosed = ease(cake.elapsed / .5) * (1 - ease((cake.elapsed - 2) / .7));
        cake.flame = 1 - ease((cake.elapsed - 1.2) / .8);
        if (cake.elapsed >= 3.2) { cake.lit = 0; cake.eyesClosed = 0; advance('kissPause'); }
      }
    }
    if (cake.phase === 'kissPause' && cake.elapsed >= .8) {
      cake.phase = 'aligning'; cake.elapsed = 0; onCakeChange();
    } else if (cake.phase === 'aligning' && cake.alignmentReady && onCakeKissStart()) {
      cake.phase = 'kissing'; cake.elapsed = 0; onCakeChange();
    } else if (cake.phase === 'constellation') {
      cake.heartProgress = ease(cake.elapsed / (settings.reducedMotion ? 2 : 5.5));
      if (cake.heartProgress === 1) { cake.phase = 'heartHold'; cake.elapsed = 0; onCakeChange(); }
    }
    if (cake.phase === 'heartHold' && cake.heartProgress === 1 && cake.elapsed >= 2.4) {
      // Actual formation completion enters heartHold; only its completed glow
      // can hand off to the original pullback/message controller, once.
      ending.center.copy(charPos).add(companionPos).multiplyScalar(.5);
      ending.azimuth = cameraState.smoothedAzimuth;
      ending.startedAt = performance.now(); ending.cameraCaptured = false;
      onEndingChange('pullback');
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
      <SecretEnvelope charPos={charPos} active={activeRoomIndex === 2 && !kiss.active && !transition.active && ending.phase === 'exploring'} cameraState={cameraState} reducedMotion={settings.reducedMotion} onNearby={onLetterNearby} onOpen={onLetterOpen} />
      <IndoorGalleries couch={couch} cameraState={cameraState} onCouchStart={onCouchStart} compact={settings.compact} activeRoomIndex={activeRoomIndex} reducedMotion={settings.reducedMotion || simpleTransitions} />
      {PHOTOS.map((photo) => (
        <PhotoFrame key={photo.id} active={activeRoomIndex !== 3 && (photo.roomIndex ?? 0) === activeRoomIndex} photo={photo} compact={settings.compact} reducedMotion={settings.reducedMotion} nearby={!kiss.active && nearbyPhoto?.id === photo.id} onClick={() => { if (!kiss.active && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onPhotoClick(photo); }} />
      ))}
      </group>
      {activeRoomIndex === 3 && <LittleUniverse ending={ending} cake={cake} memories={memories} compact={settings.compact} reducedMotion={settings.reducedMotion} simple={simpleTransitions} onPhotoClick={onPhotoClick} />}
      <Character suspended={letterOpen} couch={couch} ending={ending} cake={cake} transition={transition} controls={controls} cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} reducedMotion={settings.reducedMotion} />
      <KissParticles kiss={kiss} compact={settings.compact} reducedMotion={settings.reducedMotion} suspended={letterOpen} />
      {activeRoomIndex === 3 && <HeartConstellation ending={ending} cake={cake} charPos={charPos} companionPos={companionPos} reducedMotion={settings.reducedMotion || simpleTransitions} />}
      <CameraRig suspended={letterOpen} couch={couch} cake={cake} ending={ending} onEndingChange={onEndingChange} transition={transition} cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} settings={settings} />
    </>
  );
}

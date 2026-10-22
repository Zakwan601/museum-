import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Gallery from './Gallery';
import IndoorGalleries from './IndoorGalleries';
import PhotoFrame from './PhotoFrame';
import Character from './Character';
import CameraRig from './CameraRig';
import { PHOTOS, ROOM } from '../config';
import type { ControlState, CameraState } from '../controls';
import type { PhotoConfig } from '../config';
import { KISS_DURATION } from '../lib/kiss';
import type { KissState } from '../lib/kiss';
import type { ExperienceSettings } from '../hooks/useExperienceSettings';
import RoomStructure from './RoomStructure';
import { museumRoomAt } from '../lib/museumLayout';
import type { MuseumRoom } from '../lib/museumLayout';

interface Props {
  controls: ControlState;
  cameraState: CameraState;
  onPhotoClick: (photo: PhotoConfig) => void;
  nearbyPhoto: PhotoConfig | null;
  onNearbyPhotoChange: (photo: PhotoConfig | null) => void;
  kiss: KissState;
  onKissComplete: () => void;
  settings: ExperienceSettings;
  onRoomChange: (room: MuseumRoom) => void;
}

export default function Scene({ controls, cameraState, onPhotoClick, nearbyPhoto, onNearbyPhotoChange, kiss, onKissComplete, settings, onRoomChange }: Props) {
  const charPos = useMemo(() => new THREE.Vector3(0, 0, 4), []);
  const companionPos = useMemo(() => new THREE.Vector3(1.05, 0, 3.78), []);
  const lastNearbyId = useRef<string | null>(null);
  const currentRoomId = useRef('school');
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  useFrame((_, delta) => {
    if (!kiss.active) return;
    if (kiss.mode === 'photo' && kiss.returning && kiss.elapsed >= 2.4 && kiss.elapsed < 4.6) kiss.elapsed = 4.6;
    const limit = kiss.mode === 'photo' && !kiss.returning ? 2.4 : KISS_DURATION;
    kiss.elapsed = Math.min(limit, kiss.elapsed + Math.min(delta, .05));
    if (kiss.elapsed >= KISS_DURATION) {
      kiss.active = false;
      onKissComplete();
    }
  }, -3);

  useFrame(() => {
    const room = museumRoomAt(charPos.x);
    if (room.id !== currentRoomId.current && Math.abs(charPos.x - room.centerX) < ROOM.width / 2 - .2) {
      currentRoomId.current = room.id;
      onRoomChange(room);
      setActiveRoomIndex(room.index);
    }
    let nearest: PhotoConfig | null = null;
    let nearestDistance = Infinity;
    for (const photo of PHOTOS) {
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
      <RoomStructure />
      <Gallery settings={settings} charPos={charPos} />
      <IndoorGalleries compact={settings.compact} activeRoomIndex={activeRoomIndex} />
      {PHOTOS.map((photo) => (
        <PhotoFrame key={photo.id} photo={photo} compact={settings.compact} reducedMotion={settings.reducedMotion} nearby={!kiss.active && nearbyPhoto?.id === photo.id} onClick={() => { if (!kiss.active && !cameraState.inputLocked && performance.now() > cameraState.suppressPhotoClickUntil) onPhotoClick(photo); }} />
      ))}
      <Character controls={controls} cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} reducedMotion={settings.reducedMotion} />
      <CameraRig cameraState={cameraState} charPos={charPos} companionPos={companionPos} kiss={kiss} settings={settings} />
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Camera, Heart, Menu, X, ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';
import Scene from './components/Scene';
import VirtualJoystick from './components/VirtualJoystick';
import PhotoModal from './components/PhotoModal';
import MusicPlayer from './components/MusicPlayer';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useExperienceSettings } from './hooks/useExperienceSettings';
import { createControlState, createCameraState } from './controls';
import type { PhotoConfig } from './config';
import { createKissState } from './lib/kiss';
import { MUSEUM_ROOMS } from './lib/museumLayout';
import ImmersiveMode from './components/ImmersiveMode';

export default function App() {
  const museumElement = useRef<HTMLDivElement>(null);
  const controls = useMemo(createControlState, []);
  const cameraState = useMemo(createCameraState, []);
  const kiss = useMemo(createKissState, []);
  const viewport = useExperienceSettings();
  const [initialCamera] = useState(() => ({ position: [0, 4, 8] as [number, number, number], fov: viewport.fov, near: .08, far: 40 }));
  const [batterySaver, setBatterySaver] = useState(false);
  const [lessMotion, setLessMotion] = useState(false);
  const settings = useMemo(() => ({ ...viewport, reducedMotion: viewport.reducedMotion || lessMotion }), [viewport, lessMotion]);
  const [isKissing, setIsKissing] = useState(false);
  const [isPosing, setIsPosing] = useState(false);
  const [poseReturning, setPoseReturning] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoConfig | null>(null);
  const [nearbyPhoto, setNearbyPhoto] = useState<PhotoConfig | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(MUSEUM_ROOMS[0]);
  useKeyboardControls(controls);

  useEffect(() => {
    controls.paused = Boolean(selectedPhoto) || menuOpen;
    cameraState.inputLocked = controls.paused;
    if (controls.paused) {
      controls.keyboardX = controls.keyboardY = controls.joystickX = controls.joystickY = 0;
    }
    return () => { controls.paused = false; cameraState.inputLocked = false; };
  }, [selectedPhoto, menuOpen, controls, cameraState]);
  useEffect(() => {
    if (!showHint) return;
    const timer = window.setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, [showHint]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const startMoment = (mode: 'kiss' | 'photo') => {
    if (kiss.active || selectedPhoto) return;
    kiss.elapsed = 0; kiss.mode = mode; kiss.returning = false;
    kiss.sequence += 1; kiss.active = true;
    setIsKissing(true); setIsPosing(mode === 'photo'); setPoseReturning(false);
    setShowHint(false); setMenuOpen(false);
  };
  const finishPhotoPose = () => {
    if (kiss.mode !== 'photo' || kiss.returning) return;
    kiss.returning = true; setPoseReturning(true);
  };
  const blocked = Boolean(selectedPhoto) || menuOpen || isKissing;
  return (
    <div ref={museumElement} className="museum-app">
      <Canvas
        shadows={!batterySaver}
        camera={initialCamera}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        dpr={[1, batterySaver ? 1 : settings.dpr]}
      >
        <fog attach="fog" args={['#382234', 16, 32]} />
        <Scene controls={controls} cameraState={cameraState} onPhotoClick={setSelectedPhoto} nearbyPhoto={nearbyPhoto} onNearbyPhotoChange={setNearbyPhoto} kiss={kiss} onKissComplete={() => { setIsKissing(false); setIsPosing(false); setPoseReturning(false); }} settings={settings} onRoomChange={setCurrentRoom} />
      </Canvas>
      <div className="museum-hud">
        <div className="museum-top-left">
          <button type="button" className="hud-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close museum menu' : 'Open museum menu'} aria-expanded={menuOpen} aria-controls="museum-menu" disabled={isKissing}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="museum-location" role="status"><span className="room-progress">{currentRoom.index + 1} / {MUSEUM_ROOMS.length}</span><span>{currentRoom.name}</span></span>
        </div>
        <div className="museum-music"><MusicPlayer /></div>
        {menuOpen && <section id="museum-menu" className="museum-menu" aria-label="Museum settings">
          <h1 className="text-lg text-rose-100">A little world of us</h1>
          <p className="mt-1 text-xs leading-relaxed text-rose-100/60">Explore our memories, side by side.</p>
          <ol className="room-route" aria-label="Museum rooms">{MUSEUM_ROOMS.map(room => <li key={room.id} aria-current={room.id === currentRoom.id ? 'step' : undefined}>{room.index + 1}. {room.name}</li>)}</ol>
          <p className="mb-2 text-xs leading-relaxed text-rose-100/60">Walk through the signed openings to continue. You can return through the same passage.</p>
          <label className="menu-setting"><span>Battery saver</span><input type="checkbox" checked={batterySaver} onChange={e => setBatterySaver(e.target.checked)} /></label>
          <label className="menu-setting"><span>Reduce motion</span><input type="checkbox" checked={settings.reducedMotion} disabled={viewport.reducedMotion} onChange={e => setLessMotion(e.target.checked)} /></label>
          <button type="button" className="menu-setting w-full" onClick={() => { setMenuOpen(false); setShowHint(true); }}>How to explore <span aria-hidden="true">?</span></button>
          <p className="mt-2 text-xs text-rose-100/50">Use the heart to kiss, or the camera to pose together.</p>
        </section>}
        {showHint && !blocked && <div className="explore-hint" role="status">
          <span>{settings.compact ? 'Joystick to walk. Drag the room to look.' : 'WASD to walk. Drag the room to look.'}</span>
          <button type="button" aria-label="Dismiss instructions" onClick={() => setShowHint(false)}><X size={16} /></button>
        </div>}
        {nearbyPhoto && !blocked && <button type="button" className="photo-prompt" onClick={() => setSelectedPhoto(nearbyPhoto)} aria-label={`View photo: ${nearbyPhoto.title}`}>
          <span className="min-w-0"><span className="block truncate text-xs text-rose-100/65" aria-live="polite">{nearbyPhoto.title}</span><span className="block text-sm">Tap to view photo</span></span><ArrowUpRight size={18} aria-hidden="true" />
        </button>}
        {!selectedPhoto && !menuOpen && <div className="museum-actions">
          {isPosing ? <button type="button" className="hud-button return-button" onClick={finishPhotoPose} disabled={poseReturning} aria-label="Return to walking">{poseReturning ? 'Returning…' : 'Back to walking'}</button> : <>
            <button type="button" className="hud-button" onClick={() => startMoment('photo')} disabled={isKissing} aria-label="Pose together for a photo" title="Pose together"><Camera size={21} /><span className="action-label">Pose together</span></button>
            <button type="button" className="hud-button" onClick={() => startMoment('kiss')} disabled={isKissing} aria-label="Share a kiss" title="Share a kiss"><Heart size={21} /><span className="action-label">{isKissing ? 'A moment for us…' : 'Share a kiss'}</span></button>
          </>}
        </div>}
        {isKissing && !isPosing && <div className="cinema-bars" aria-hidden="true" />}
        <div className={`museum-joystick ${blocked ? 'invisible' : ''}`}><VirtualJoystick controls={controls} disabled={blocked} /></div>
      </div>
      {selectedPhoto && <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      <ImmersiveMode target={museumElement} enabled={settings.compact} modalOpen={Boolean(selectedPhoto)} hideEntry={menuOpen || isKissing || showHint} />
    </div>
  );
}


import { createEnding, memoryKey } from './lib/ending';
import type { EndingPhase } from './lib/ending';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Camera, Heart, Menu, X, ArrowUpRight, BookOpen } from 'lucide-react';
import * as THREE from 'three';
import Scene from './components/Scene';
import VirtualJoystick from './components/VirtualJoystick';
import PhotoModal from './components/PhotoModal';
import MusicPlayer from './components/MusicPlayer';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useExperienceSettings } from './hooks/useExperienceSettings';
import { createControlState, createCameraState } from './controls';
import type { PhotoConfig } from './config';
import { isBook } from './lib/books';
import { createRoomTransition } from './lib/roomTransition';
import type { RoomPortal } from './lib/roomTransition';
import { createKissState } from './lib/kiss';
import { MUSEUM_ROOMS } from './lib/museumLayout';
import ImmersiveMode from './components/ImmersiveMode';
import Intro from './components/Intro';
import { useImmersiveMode } from './hooks/useImmersiveMode';

export default function App() {
  const [entered, setEntered] = useState(false);
  const museumElement = useRef<HTMLDivElement>(null);
  const immersive = useImmersiveMode(museumElement);
  const finishIntro = useCallback(() => setEntered(true), []);
  const controls = useMemo(createControlState, []);
  const cameraState = useMemo(createCameraState, []);
  const kiss = useMemo(createKissState, []);
  const transition = useMemo(createRoomTransition, []);
  const ending = useMemo(createEnding, []);
  const [endingPhase, setEndingPhase] = useState<EndingPhase>('exploring');
  const [memories, setMemories] = useState<PhotoConfig[]>([]);
  const [story, setStory] = useState(0);
  const inEnding = endingPhase !== 'exploring';
  const onEndingChange = (phase: EndingPhase) => { ending.phase = phase; setEndingPhase(phase); };
  const [isTransitioning, setIsTransitioning] = useState(false);
  const viewport = useExperienceSettings();
  const [initialCamera] = useState(() => ({ position: [0, 4, 8] as [number, number, number], fov: viewport.fov, near: .08, far: 40 }));
  const [batterySaver, setBatterySaver] = useState(false);
  const [lessMotion, setLessMotion] = useState(false);
  const settings = useMemo(() => ({ ...viewport, reducedMotion: viewport.reducedMotion || lessMotion }), [viewport, lessMotion]);
  const [isKissing, setIsKissing] = useState(false);
  const [isGivingBouquet, setIsGivingBouquet] = useState(false);
  const [isPosing, setIsPosing] = useState(false);
  const [poseReturning, setPoseReturning] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoConfig | null>(null);
  const [nearbyPhoto, setNearbyPhoto] = useState<PhotoConfig | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(MUSEUM_ROOMS[0]);
  useKeyboardControls(controls);

  useEffect(() => {
    controls.paused = !entered || Boolean(selectedPhoto) || menuOpen || isKissing || isTransitioning || inEnding;
    cameraState.inputLocked = controls.paused;
    if (controls.paused) {
      controls.keyboardX = controls.keyboardY = controls.joystickX = controls.joystickY = 0;
    }
    return () => { controls.paused = false; cameraState.inputLocked = false; };
  }, [entered, selectedPhoto, menuOpen, isKissing, isTransitioning, inEnding, controls, cameraState]);
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

  const startMoment = (mode: 'kiss' | 'photo' | 'bouquet') => {
    if (kiss.active || transition.active || selectedPhoto || menuOpen || (inEnding && mode !== 'bouquet')) return false;
    if (mode === 'bouquet') onEndingChange('bouquet');
    kiss.elapsed = 0; kiss.mode = mode; kiss.returning = false;
    kiss.sequence += 1; kiss.active = true;
    setIsKissing(true); setIsGivingBouquet(mode === 'bouquet'); setIsPosing(mode === 'photo'); setPoseReturning(false);
    setShowHint(false); setMenuOpen(false);
    return true;
  };
  const enterPortal = (portal: RoomPortal) => {
    if (!portal || transition.active || kiss.active || selectedPhoto || menuOpen) return;
    if (portal.to === 3) onEndingChange('arrival');
    transition.from = portal.from; transition.to = portal.to; transition.direction = portal.direction;
    transition.elapsed = 0; transition.startedAt = performance.now(); transition.transferred = false; transition.sequence += 1; transition.active = true;
    controls.paused = true; cameraState.inputLocked = true;
    controls.keyboardX = controls.keyboardY = controls.joystickX = controls.joystickY = 0;
    setIsTransitioning(true); setShowHint(false);
  };
  const finishPhotoPose = () => {
    if (kiss.mode !== 'photo' || kiss.returning) return;
    kiss.returning = true; setPoseReturning(true);
  };
  const openPhoto = (photo: PhotoConfig) => {
    if (!isBook(photo)) setMemories(previous => previous.some(p => memoryKey(p) === memoryKey(photo)) ? previous : [...previous, photo]);
    setSelectedPhoto(photo);
  };
  const replayStory = () => {
    // The fullscreen host stays mounted; only the experience is reset.
    setEntered(false); setSelectedPhoto(null); setNearbyPhoto(null); setMemories([]);
    setMenuOpen(false); setShowHint(false); setIsKissing(false); setIsGivingBouquet(false); setIsPosing(false); setPoseReturning(false); setIsTransitioning(false);
    Object.assign(controls, createControlState()); Object.assign(cameraState, createCameraState());
    Object.assign(kiss, createKissState()); Object.assign(transition, createRoomTransition()); Object.assign(ending, createEnding());
    setEndingPhase('exploring'); setCurrentRoom(MUSEUM_ROOMS[0]); setStory(value => value + 1);
  };
  const blocked = Boolean(selectedPhoto) || menuOpen || isKissing || isTransitioning || inEnding;
  return (
    <div ref={museumElement} className={`museum-app ${entered ? 'museum-arrival' : ''} ${inEnding ? 'ending-theme' : ''}`}>
      {!entered ? <Intro onEnter={finishIntro} onEnterRequest={() => { if (settings.compact) void immersive.enter(); }} reducedMotion={settings.reducedMotion} /> : <>

      <Canvas
        shadows={!batterySaver}
        camera={initialCamera}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        dpr={[1, batterySaver ? 1 : settings.dpr]}
      >
        <fog attach="fog" args={['#382234', 16, 32]} />
        <Scene ending={ending} memories={memories} onEndingChange={onEndingChange} transition={transition} simpleTransitions={batterySaver} onPortalEnter={enterPortal} onTransitionComplete={() => setIsTransitioning(false)} controls={controls} cameraState={cameraState} onPhotoClick={openPhoto} nearbyPhoto={nearbyPhoto} onNearbyPhotoChange={setNearbyPhoto} kiss={kiss} onBouquetStart={() => startMoment('bouquet')} onKissComplete={() => { setIsKissing(false); setIsGivingBouquet(false); setIsPosing(false); setPoseReturning(false); }} settings={settings} onRoomChange={setCurrentRoom} />
      </Canvas>
      <div className="museum-hud">
        <div className={`museum-top-left ${inEnding ? 'ending-hidden' : ''}`}>
          <button type="button" className="hud-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close museum menu' : 'Open museum menu'} aria-expanded={menuOpen} aria-controls="museum-menu" disabled={isKissing || isTransitioning}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="museum-location" role="status"><span className="room-progress">{currentRoom.index + 1} / {MUSEUM_ROOMS.length}</span><span>{currentRoom.name}</span></span>
        </div>
        <div className={`museum-music ${inEnding ? 'ending-music' : ''}`}><MusicPlayer key={story} softened={endingPhase === 'pullback' || endingPhase === 'complete'} /></div>
        {menuOpen && <section id="museum-menu" className="museum-menu" aria-label="Museum settings">
          <h1 className="text-lg text-rose-100">A little world of us</h1>
          <p className="mt-1 text-xs leading-relaxed text-rose-100/60">Explore our memories, side by side.</p>
          <ol className="room-route" aria-label="Museum rooms">{MUSEUM_ROOMS.map(room => <li key={room.id} aria-current={room.id === currentRoom.id ? 'step' : undefined}>{room.index + 1}. {room.name}</li>)}</ol>
          <p className="mb-2 text-xs leading-relaxed text-rose-100/60">Walk through a glowing arch to enter the next room. You can return through the arch behind you.</p>
          <label className="menu-setting"><span>Battery saver</span><input type="checkbox" checked={batterySaver} onChange={e => setBatterySaver(e.target.checked)} /></label>
          <label className="menu-setting"><span>Reduce motion</span><input type="checkbox" checked={settings.reducedMotion} disabled={viewport.reducedMotion} onChange={e => setLessMotion(e.target.checked)} /></label>
          <button type="button" className="menu-setting w-full" onClick={() => { setMenuOpen(false); setShowHint(true); }}>How to explore <span aria-hidden="true">?</span></button>
          <p className="mt-2 text-xs text-rose-100/50">Use the heart to kiss, or the camera to pose together.</p>
        </section>}
        {showHint && !blocked && <div className="explore-hint" role="status">
          <span>{settings.compact ? 'Joystick to walk. Drag the room to look.' : 'WASD to walk. Move the mouse to look.'}</span>
          <button type="button" aria-label="Dismiss instructions" onClick={() => setShowHint(false)}><X size={16} /></button>
        </div>}
        {nearbyPhoto && !blocked && <button type="button" className={`photo-prompt ${isBook(nearbyPhoto) ? '' : 'vintage-photo-prompt'}`} onClick={() => openPhoto(nearbyPhoto)} aria-label={`View ${isBook(nearbyPhoto) ? 'book' : 'photo'}: ${nearbyPhoto.title}`}>
          <span className="min-w-0"><span className="block truncate text-xs text-rose-100/65" lang={isBook(nearbyPhoto) ? 'bn' : undefined} aria-live="polite">{nearbyPhoto.title}</span><span className="block text-sm">Tap to view {isBook(nearbyPhoto) ? 'book' : 'photo'}</span></span>{isBook(nearbyPhoto) ? <BookOpen size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
        </button>}
        {!selectedPhoto && !menuOpen && !isGivingBouquet && !isTransitioning && !inEnding && <div className="museum-actions">
          {isPosing ? <button type="button" className="hud-button return-button" onClick={finishPhotoPose} disabled={poseReturning} aria-label="Return to walking">{poseReturning ? 'Returning…' : 'Back to walking'}</button> : <>
            <button type="button" className="hud-button" onClick={() => startMoment('photo')} disabled={isKissing} aria-label="Pose together for a photo" title="Pose together"><Camera size={21} /><span className="action-label">Pose together</span></button>
            <button type="button" className="hud-button" onClick={() => startMoment('kiss')} disabled={isKissing} aria-label="Share a kiss" title="Share a kiss"><Heart size={21} /><span className="action-label">{isKissing ? 'A moment for us…' : 'Kiss'}</span></button>
          </>}
        </div>}
        {isKissing && !isPosing && <div className="cinema-bars" aria-hidden="true" />}
        {isGivingBouquet && <p className="bouquet-caption" role="status">For all our tomorrows.</p>}
        <div className={`museum-joystick ${blocked ? 'invisible' : ''}`}><VirtualJoystick controls={controls} disabled={blocked} /></div>
      </div>
      <div ref={node => { transition.overlay = node; }} className={`room-transition-overlay ${isTransitioning ? 'is-active' : ''}`} aria-hidden={!isTransitioning}>
        {isTransitioning && <p role="status">{MUSEUM_ROOMS[transition.to].name}</p>}
      </div>
      {endingPhase === 'complete' && <section className="ending-message" aria-labelledby="ending-title" aria-live="polite">
        <p className="ending-eyebrow">Our Little Universe</p>
        <h1 id="ending-title">Happy 7 year Anniversary<br />My sweetest baby girl</h1>
        <p>Of all the stars, I&#8217;m glad I found you.<br />Here&#8217;s to our little memories, and a lifetime of making more, together.</p>
        <button type="button" onClick={replayStory}>{'Replay Our Story \u2728'}</button>
        {memories.length > 0 && <div className="ending-memory-access" aria-label="Collected memories">{memories.map(photo => <button className="sr-only focus:not-sr-only" key={photo.id} onClick={() => openPhoto(photo)}>View memory: {photo.title}</button>)}</div>}
      </section>}
      {selectedPhoto && <PhotoModal key={selectedPhoto.id} photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      </>}
      {entered && <ImmersiveMode mode={immersive} enabled={settings.compact} modalOpen={Boolean(selectedPhoto)} hideEntry={inEnding || menuOpen || isKissing || isTransitioning || showHint} hideMessage={inEnding || isTransitioning || isKissing} />}
    </div>
  );
}


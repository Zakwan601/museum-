import { readPreference, savePreference } from './lib/preferences';
import SceneReady from './components/SceneReady';
import PhotoShutter from './components/PhotoShutter';
import LoveLetter from './components/LoveLetter';
import { createCouchState, couchUi, startCouch, leaveCouch } from './lib/couch';
import ControlTutorial from './components/ControlTutorial';
import { createCakeState, cakeControlsReady, cakeUi, startCakeCeremony, blowCakeCandles } from './lib/cake';
import { createEnding, memoryKey } from './lib/ending';
import type { EndingPhase } from './lib/ending';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Camera, Heart, HeartHandshake, Menu, X } from 'lucide-react';
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
  const [sceneReady, setSceneReady] = useState(false);
  const markSceneReady = useCallback(() => setSceneReady(true), []);
  const [feedback, setFeedback] = useState(0);
  const [haptics, setHaptics] = useState(() => readPreference('museum-haptics', false));
  const acknowledge = () => { setFeedback(value => value + 1); if (haptics && navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(12); };
  const [entered, setEntered] = useState(false);
  const museumElement = useRef<HTMLDivElement>(null);
  const immersive = useImmersiveMode(museumElement);
  const finishIntro = useCallback(() => { setEntered(true); setShowHint(true); }, []);
  const controls = useMemo(createControlState, []);
  const cameraState = useMemo(createCameraState, []);
  const kiss = useMemo(createKissState, []);
  const transition = useMemo(createRoomTransition, []);
  const ending = useMemo(createEnding, []);
  const couch = useMemo(createCouchState, []);
  const [couchState, setCouchState] = useState(() => couchUi(couch));
  const onCouchChange = useCallback(() => setCouchState(couchUi(couch)), [couch]);
  const sitting = couchState.phase !== 'idle';
  const sitTogether = () => { if (!selectedPhoto && !menuOpen && !kiss.active && !transition.active && !inEnding && startCouch(couch)) { setShowHint(false); onCouchChange(); } };
  const cake = useMemo(createCakeState, []);
  const [cakeState, setCakeState] = useState(() => cakeUi(cake));
  const onCakeChange = useCallback(() => setCakeState(cakeUi(cake)), [cake]);
  const [endingPhase, setEndingPhase] = useState<EndingPhase>('exploring');
  const [memories, setMemories] = useState<PhotoConfig[]>([]);
  const [story, setStory] = useState(0);
  const inEnding = endingPhase !== 'exploring';
  const exploringCake = endingPhase === 'cake' && cakeControlsReady(cake);
  const endingLocked = inEnding && !exploringCake;
  const onEndingChange = (phase: EndingPhase) => { ending.phase = phase; setEndingPhase(phase); };
  const [isTransitioning, setIsTransitioning] = useState(false);
  const viewport = useExperienceSettings();
  const [initialCamera] = useState(() => ({ position: [0, 4, 8] as [number, number, number], fov: viewport.fov, near: .08, far: 40 }));
  const [batterySaver, setBatterySaver] = useState(false);
  const [lessMotion, setLessMotion] = useState(false);
  const settings = useMemo(() => ({
    ...viewport,
    distance: viewport.phone && !viewport.portrait && immersive.fullscreen ? 4.0 : viewport.distance,
    dpr: viewport.phone && immersive.fullscreen ? 1.5 : viewport.dpr,
    reducedMotion: viewport.reducedMotion || lessMotion,
  }), [viewport, lessMotion, immersive.fullscreen]);
  const [isKissing, setIsKissing] = useState(false);
  const [isGivingBouquet, setIsGivingBouquet] = useState(false);
  const [isPosing, setIsPosing] = useState(false);
  const [poseReturning, setPoseReturning] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [nearbyLetter, setNearbyLetter] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoConfig | null>(null);
  const [nearbyPhoto, setNearbyPhoto] = useState<PhotoConfig | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(MUSEUM_ROOMS[0]);
  useKeyboardControls(controls);

  useEffect(() => {
    controls.paused = !entered || letterOpen || Boolean(selectedPhoto) || menuOpen || isKissing || isTransitioning || endingLocked || sitting;
    cameraState.inputLocked = controls.paused;
    if (controls.paused) {
      controls.keyboardX = controls.keyboardY = controls.joystickX = controls.joystickY = 0;
    }
    return () => { controls.paused = false; cameraState.inputLocked = false; };
  }, [entered, letterOpen, selectedPhoto, menuOpen, isKissing, isTransitioning, endingLocked, sitting, controls, cameraState]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const [momentHint, setMomentHint] = useState(false);
  const startMoment = (mode: 'kiss' | 'photo' | 'bouquet' | 'hug' | 'flower') => {
    if (couch.phase !== 'idle' || kiss.active || transition.active || (letterOpen && mode !== 'flower') || selectedPhoto || menuOpen || (inEnding && mode !== 'bouquet' && !(mode === 'kiss' && cake.phase === 'aligning'))) return false;
    if (mode !== 'photo' && mode !== 'flower' && kiss.pairDistance > 1.3) { setMomentHint(true); return false; }
    setMomentHint(false);
    if (mode === 'bouquet') onEndingChange('bouquet');
    kiss.elapsed = 0; kiss.mode = mode; kiss.returning = false;
    kiss.sequence += 1; kiss.active = true;
    setIsKissing(true); setIsGivingBouquet(mode === 'bouquet'); setIsPosing(mode === 'photo'); setPoseReturning(false);
    setShowHint(false); setMenuOpen(false);
    return true;
  };
  const enterPortal = (portal: RoomPortal) => {
    if (!portal || transition.active || kiss.active || letterOpen || selectedPhoto || menuOpen) return;
    if (couch.phase !== 'idle') { couch.phase = 'idle'; couch.cancelled = true; couch.nearby = false; onCouchChange(); }
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
    if (letterOpen) return;
    if (!isBook(photo)) setMemories(previous => previous.some(p => memoryKey(p) === memoryKey(photo)) ? previous : [...previous, photo]);
    acknowledge();
    setSelectedPhoto(photo);
  };
  const replayStory = () => {
    // The fullscreen host stays mounted; only the experience is reset.
    setSceneReady(false); setFeedback(0);
    setLetterOpen(false); setNearbyLetter(false);
    setMomentHint(false); setEntered(false); setSelectedPhoto(null); setNearbyPhoto(null); setMemories([]);
    setMenuOpen(false); setShowHint(false); setIsKissing(false); setIsGivingBouquet(false); setIsPosing(false); setPoseReturning(false); setIsTransitioning(false);
    Object.assign(controls, createControlState()); Object.assign(cameraState, createCameraState());
    Object.assign(couch, createCouchState()); setCouchState(couchUi(couch));
    Object.assign(kiss, createKissState()); Object.assign(transition, createRoomTransition()); Object.assign(ending, createEnding()); Object.assign(cake, createCakeState()); setCakeState(cakeUi(cake));
    setEndingPhase('exploring'); setCurrentRoom(MUSEUM_ROOMS[0]); setStory(value => value + 1);
  };
  const openLetter = () => {
    if (!nearbyLetter || letterOpen || selectedPhoto || menuOpen || kiss.active || transition.active || inEnding || sitting) return;
    controls.paused = true; cameraState.inputLocked = true;
    controls.keyboardX = controls.keyboardY = controls.joystickX = controls.joystickY = 0;
    acknowledge();
    setLetterOpen(true);
  };
  const closeLetter = () => {
    setLetterOpen(false);
    if (!kiss.flowerReceived) startMoment('flower');
  };
  const blocked = letterOpen || Boolean(selectedPhoto) || menuOpen || isKissing || isTransitioning || endingLocked || sitting;
  return (
    <div ref={museumElement} data-ending-complete={endingPhase === 'complete'} className={`museum-app ${entered ? 'museum-arrival' : ''} ${inEnding ? 'ending-theme' : ''}`}>
      {!entered ? <Intro onEnter={finishIntro} onEnterRequest={() => { if (settings.compact) void immersive.enter(); }} reducedMotion={settings.reducedMotion} /> : <>

      <Canvas
        shadows={!batterySaver}
        camera={initialCamera}
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        dpr={[1, batterySaver ? 1 : settings.dpr]}
      >
        <SceneReady onReady={markSceneReady} />
        <fog attach="fog" args={['#382234', 16, 32]} />
        <Scene letterOpen={letterOpen} onLetterNearby={setNearbyLetter} onLetterOpen={openLetter} couch={couch} onCouchChange={onCouchChange} onCouchStart={sitTogether} ending={ending} cake={cake} onCakeChange={onCakeChange} memories={memories} onEndingChange={onEndingChange} transition={transition} simpleTransitions={batterySaver} onPortalEnter={enterPortal} onTransitionComplete={() => setIsTransitioning(false)} controls={controls} cameraState={cameraState} onPhotoClick={openPhoto} nearbyPhoto={nearbyPhoto} onNearbyPhotoChange={setNearbyPhoto} kiss={kiss} onBouquetStart={() => startMoment('bouquet')} onCakeKissStart={() => startMoment('kiss')} onKissComplete={() => { setIsKissing(false); setIsGivingBouquet(false); setIsPosing(false); setPoseReturning(false); }} settings={settings} onRoomChange={setCurrentRoom} />
      </Canvas>
      {!sceneReady && <div className="museum-loading" role="status"><p>Preparing our little world...</p></div>}
      {isPosing && <PhotoShutter key={kiss.sequence} reducedMotion={settings.reducedMotion} haptics={haptics} />}
      <div className="museum-hud">
        <div className={`museum-top-left ${inEnding && !exploringCake ? 'ending-hidden' : ''}`}>
          <button type="button" className="hud-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close museum menu' : 'Open museum menu'} aria-expanded={menuOpen} aria-controls="museum-menu" disabled={isKissing || isTransitioning}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="museum-location" role="status"><span className="room-progress">{currentRoom.index + 1} / {MUSEUM_ROOMS.length}</span><span>{currentRoom.name}</span></span>
        </div>
        {menuOpen && <section id="museum-menu" className="museum-menu" aria-label="Museum settings">
          <h1 className="text-lg text-rose-100">A little world of us</h1>
          <ol className="room-route" aria-label="Museum rooms">{MUSEUM_ROOMS.map(room => <li key={room.id} aria-current={room.id === currentRoom.id ? 'step' : undefined}>{room.index + 1}. {room.name}</li>)}</ol>
          <label className="menu-setting"><span>Battery saver</span><input type="checkbox" checked={batterySaver} onChange={e => setBatterySaver(e.target.checked)} /></label>
          <label className="menu-setting"><span>Reduce motion</span><input type="checkbox" checked={settings.reducedMotion} disabled={viewport.reducedMotion} onChange={e => setLessMotion(e.target.checked)} /></label>
          {settings.compact && <label className="menu-setting"><span>Gentle vibration</span><input type="checkbox" checked={haptics} onChange={e => { setHaptics(e.target.checked); savePreference('museum-haptics', e.target.checked); }} /></label>}
          {exploringCake && <>
            {memories.length > 0 && <details className="cake-memories"><summary>Collected memories ({memories.length})</summary>{memories.map(photo => <button type="button" className="menu-setting w-full" key={photo.id} onClick={() => { setMenuOpen(false); openPhoto(photo); }}>View {photo.title}</button>)}</details>}
            <button type="button" className="menu-setting w-full" onClick={replayStory}>{'Replay Our Story'}</button>
          </>}
        </section>}
        {showHint && !nearbyLetter && !blocked && !couchState.nearby && <ControlTutorial controls={controls} cameraState={cameraState} onClose={() => setShowHint(false)} />}
        {nearbyLetter && !blocked && <button type="button" className="photo-prompt vintage-photo-prompt secret-letter-prompt" onClick={openLetter}>A Little Secret {'\uD83D\uDC8C'}</button>}
        {nearbyPhoto && !nearbyLetter && !blocked && <button type="button" className={`photo-prompt ${isBook(nearbyPhoto) ? '' : 'vintage-photo-prompt'}`} onClick={() => openPhoto(nearbyPhoto)} aria-label={`View ${isBook(nearbyPhoto) ? 'book' : 'photo'}: ${nearbyPhoto.title}`}>
          <span className="min-w-0"><span className="block truncate text-xs text-rose-100/65" lang={isBook(nearbyPhoto) ? 'bn' : undefined} aria-live="polite">{nearbyPhoto.title}</span><span className="block text-sm">Tap to view </span></span>
        </button>}
        {!letterOpen && !selectedPhoto && !menuOpen && !isGivingBouquet && !isTransitioning && !inEnding && !sitting && <div className="museum-actions">
          {isPosing ? <button type="button" className="hud-button return-button" onClick={finishPhotoPose} disabled={poseReturning} aria-label="Return to walking">{poseReturning ? 'Returning…' : 'Back to walking'}</button> : <>
            <button type="button" className="hud-button" onClick={() => startMoment('photo')} disabled={isKissing} aria-label="Pose together for a photo" title="Pose together"><Camera size={21} /><span className="action-label">Futooo</span></button>
            <button type="button" className="hud-button" onClick={() => startMoment('hug')} disabled={isKissing} aria-label="Share a hug" title="Hug"><HeartHandshake size={21} /><span className="action-label">Hug {'\u2661'}</span></button>
            <button type="button" className="hud-button" onClick={() => startMoment('kiss')} disabled={isKissing} aria-label="Share a kiss" title="Share a kiss"><Heart size={21} /><span className="action-label">{isKissing ? 'A moment for us…' : 'Kiss'}</span></button>
          </>}
        </div>}
        {isKissing && !isPosing && <div className="cinema-bars" aria-hidden="true" />}
        {momentHint && !isKissing && !inEnding && !menuOpen && !selectedPhoto && <p className="cake-invitation" role="status">Move a little closer to each other first. </p>}
        {isKissing && kiss.mode === 'flower' && <p className="bouquet-caption flower-caption" role="status">A little flower for my cute baby </p>}
        {isGivingBouquet && <p className="bouquet-caption" role="status">For all our tomorrows.</p>}
        {exploringCake && !selectedPhoto && !menuOpen && <>
          {cakeState.phase === 'inviting' && !cakeState.nearby && !showHint && <p className="cake-invitation" role="status">Edike ashooo buri..</p>}
          {cakeState.nearby && <div className="cake-interaction">
            <button type="button" className="hud-button cake-wish-button" aria-label="Make a Little Wish"  onClick={() => { if (startCakeCeremony(cake)) onCakeChange(); }}>Make a Little Wish</button>

          </div>}
        </>}
        {endingPhase === 'cake' && ['wish', 'blowing'].includes(cakeState.phase) && <div className="cake-ceremony-ui">
          <p className="cake-wish-message" role="status">Close your eyes. If you could make one wish for us, what would it be?</p>
          {cakeState.phase === 'wish' && cakeState.canBlow && <button type="button" className="hud-button cake-blow-button" onClick={() => { if (blowCakeCandles(cake)) onCakeChange(); }}>Blow Out Candles </button>}
        </div>}
        {!selectedPhoto && !menuOpen && (couchState.nearby || sitting) && <div className="couch-interaction">
          <button type="button" className="hud-button" disabled={couchState.phase === 'entering' || couchState.phase === 'leaving'} onClick={() => { if (couchState.phase === 'idle') sitTogether(); else if (leaveCouch(couch)) onCouchChange(); }}>{couchState.phase === 'idle' ? 'Sit Together \u2661' : couchState.phase === 'seated' ? 'Get Up' : couchState.phase === 'entering' ? 'Sitting together...' : 'Getting up...'}</button>
        </div>}
        <div className={`museum-joystick ${blocked ? 'invisible' : ''}`}><VirtualJoystick controls={controls} disabled={blocked} /></div>
      </div>
      <div ref={node => { transition.overlay = node; }} className={`room-transition-overlay ${isTransitioning ? 'is-active' : ''}`} aria-hidden={!isTransitioning}>
        {isTransitioning && <p role="status">{MUSEUM_ROOMS[transition.to].name}</p>}
      </div>
      {endingPhase === 'complete' && <section className="ending-message" aria-labelledby="ending-title" aria-live="polite">
        <h1 id="ending-title">Happy 7 year Anniversary<br />My sweetest baby girl</h1>
        <p>Of all the stars, I&#8217;m glad I found you.<br />Here&#8217;s to our little memories, and a lifetime of making more, together.</p>
        <button type="button" onClick={replayStory}>{'Replay Our Story'}</button>
        {memories.length > 0 && <div className="ending-memory-access" aria-label="Collected memories">{memories.map(photo => <button className="sr-only focus:not-sr-only" key={photo.id} onClick={() => openPhoto(photo)}>View memory: {photo.title}</button>)}</div>}
      </section>}
      {feedback > 0 && <div key={`feedback-${feedback}`} className={`interaction-glow ${settings.reducedMotion ? 'quiet' : ''}`} aria-hidden="true" />}
      {letterOpen && <LoveLetter onClose={closeLetter} reducedMotion={settings.reducedMotion} />}
      {selectedPhoto && <PhotoModal key={selectedPhoto.id} photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      </>}
      <div className={`museum-music story-music ${!entered ? 'intro-music' : inEnding ? 'ending-music' : ''}`}><MusicPlayer key={story} softened={endingPhase === 'cake' || endingPhase === 'pullback' || endingPhase === 'complete'} /></div>
      {entered && <ImmersiveMode mode={immersive} enabled={settings.compact} modalOpen={letterOpen || Boolean(selectedPhoto)} hideEntry={inEnding || menuOpen || isKissing || isTransitioning || showHint} hideMessage={inEnding || isTransitioning || isKissing} />}
    </div>
  );
}


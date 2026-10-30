import { readPreference, savePreference } from '../lib/preferences';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { AmbientMusic } from '../lib/ambientMusic';
import { MUSIC } from '../config';
export default function MusicPlayer({ softened = false }: { softened?: boolean }) {
  const [music] = useState(() => new AmbientMusic());
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const hasStarted = useRef(false);
  useEffect(() => {
    let active = true;
    const remove = () => {
      document.removeEventListener('pointerdown', firstGesture, true);
      document.removeEventListener('keydown', firstGesture, true);
    };
    const start = () => {
      void music.play().then(() => {
        if (!active) return;
        setIsPlaying(music.isPlaying);
        if (music.isPlaying) { hasStarted.current = true; remove(); }
      }).catch(() => { /* Browsers may require the first star tap to allow sound. */ });
    };
    const firstGesture = (event: Event) => {
      if (hasStarted.current) { remove(); return; }
      if (event.target instanceof Element && event.target.closest('[data-music-control]')) return;
      if (event instanceof KeyboardEvent && (event.key === 'Tab' || event.key === 'Escape' || event.repeat)) return;
      start();
    };
    document.addEventListener('pointerdown', firstGesture, true);
    document.addEventListener('keydown', firstGesture, true);
    if (readPreference('museum-music-enabled', true)) start();
    else { hasStarted.current = true; remove(); }
    return () => { active = false; remove(); music.dispose(); };
  }, [music]);
  useEffect(() => music.soften(softened), [music, softened]);
  return <button type="button" data-music-control className="hud-button" onClick={async () => { try { await music.toggle(); if (music.isPlaying) hasStarted.current = true; setIsPlaying(music.isPlaying); savePreference('museum-music-enabled', music.isPlaying); setError(false); } catch { setError(true); setIsPlaying(false); } }} aria-label={error ? 'Music could not play. Tap to retry.' : isPlaying ? 'Pause music' : 'Play music'} aria-pressed={isPlaying} title={`${MUSIC.title} · ${isPlaying ? 'Pause' : 'Play'} music`}>
    {isPlaying ? <Pause size={18} /> : <Play size={18} />}<span className="music-label">{error ? 'Unable to play. Tap to retry' : MUSIC.title}</span>
  </button>;
}

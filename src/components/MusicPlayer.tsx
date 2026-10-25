import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { AmbientMusic } from '../lib/ambientMusic';
import { MUSIC } from '../config';
export default function MusicPlayer({ softened = false }: { softened?: boolean }) {
  const [music] = useState(() => new AmbientMusic());
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => () => music.dispose(), [music]);
  useEffect(() => music.soften(softened), [music, softened]);
  return <button type="button" className="hud-button" onClick={async () => { try { await music.toggle(); setIsPlaying(music.isPlaying); setError(false); } catch { setError(true); setIsPlaying(false); } }} aria-label={error ? 'Music could not play. Tap to retry.' : isPlaying ? 'Pause music' : 'Play music'} aria-pressed={isPlaying} title={`${MUSIC.title} · ${isPlaying ? 'Pause' : 'Play'} music`}>
    {isPlaying ? <Pause size={18} /> : <Play size={18} />}<span className="music-label">{error ? 'Unable to play. Tap to retry' : MUSIC.title}</span>
  </button>;
}

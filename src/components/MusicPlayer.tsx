import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { AmbientMusic } from '../lib/ambientMusic';
import { MUSIC } from '../config';
export default function MusicPlayer({ softened = false }: { softened?: boolean }) {
  const [music] = useState(() => new AmbientMusic());
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => () => music.dispose(), [music]);
  useEffect(() => music.soften(softened), [music, softened]);
  return <button type="button" className="hud-button" onClick={() => { music.toggle(); setIsPlaying(music.isPlaying); }} aria-label={isPlaying ? 'Pause music' : 'Play music'} aria-pressed={isPlaying} title={`${MUSIC.title} · ${isPlaying ? 'Pause' : 'Play'} music`}>
    {isPlaying ? <Pause size={18} /> : <Play size={18} />}<span className="music-label">{MUSIC.title}</span>
  </button>;
}

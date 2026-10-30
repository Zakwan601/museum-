import { useEffect, useState } from 'react';
import { readPreference } from '../lib/preferences';
export default function PhotoShutter({ reducedMotion, haptics }: { reducedMotion: boolean; haptics: boolean }) {
  const [captured, setCaptured] = useState(false);
  useEffect(() => {
    let context: AudioContext | undefined;
    const timer = window.setTimeout(() => {
      setCaptured(true);
      if (haptics && navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(15);
      if (!readPreference('museum-music-enabled', true)) return;
      try {
        context = new AudioContext();
        void context.resume().then(() => {
          if (!context || context.state !== 'running') return;
          const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .075), context.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
          const source = context.createBufferSource(), gain = context.createGain(), filter = context.createBiquadFilter();
          source.buffer = buffer; gain.gain.value = .025; filter.type = 'highpass'; filter.frequency.value = 1800;
          source.connect(filter); filter.connect(gain); gain.connect(context.destination);
          source.onended = () => { void context?.close(); }; source.start();
        }).catch(() => { void context?.close(); });
      } catch { /* Shutter sound is optional. */ }
    }, 2200);
    return () => { clearTimeout(timer); if (context && context.state !== 'closed') void context.close(); };
  }, [haptics]);
  return captured ? <div className={reducedMotion ? 'photo-captured quiet' : 'photo-captured'} role="status"><span>Just us.</span></div> : null;
}

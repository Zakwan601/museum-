import { useEffect, useState } from 'react';

export function viewportSettings(width: number, height: number, coarse = false) {
  const phone = Math.min(width, height) < 600 && (width < 1024 || coarse);
  const tablet = !phone && (width < 1100 || coarse);
  const portrait = height > width;
  return {
    width, height, phone, tablet, portrait,
    compact: phone || tablet,
    fov: phone ? (portrait ? 74 : 72) : tablet ? 72 : 60,
    distance: phone ? 4.8 : tablet ? 6 : 5,
    pitchOffset: phone ? .02 : tablet ? .04 : 0,
    lookHeight: phone ? 1.25 : tablet ? 1.3 : 1.1,
    dpr: phone ? 1.25 : tablet ? 1.5 : 1.75,
    shadowSize: phone ? 512 : 1024,
  };
}
export type ViewportSettings = ReturnType<typeof viewportSettings>;
export function useExperienceSettings() {
  const read = () => ({ ...viewportSettings(window.innerWidth, window.innerHeight, matchMedia('(pointer: coarse)').matches), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
  const [settings, setSettings] = useState(read);
  useEffect(() => {
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setSettings(read())); };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = matchMedia('(pointer: coarse)');
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    document.addEventListener('fullscreenchange', update);
    screen.orientation?.addEventListener?.('change', update);
    window.visualViewport?.addEventListener('resize', update);
    motion.addEventListener('change', update);
    pointer.addEventListener('change', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); document.removeEventListener('fullscreenchange', update); screen.orientation?.removeEventListener?.('change', update); window.visualViewport?.removeEventListener('resize', update); motion.removeEventListener('change', update); pointer.removeEventListener('change', update); };
  }, []);
  return settings;
}
export type ExperienceSettings = ReturnType<typeof useExperienceSettings>;

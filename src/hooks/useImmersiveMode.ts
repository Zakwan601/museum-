import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

export function useImmersiveMode(target: RefObject<HTMLElement>) {
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false), mounted = useRef(false), ownsLock = useRef(false);
  const generation = useRef(0);
  const unlock = useCallback(() => {
    if (!ownsLock.current) return;
    ownsLock.current = false;
    try { screen.orientation?.unlock?.(); } catch { /* Some browsers unlock automatically on exit. */ }
  }, []);
  const sync = useCallback(() => {
    const active = Boolean(target.current && document.fullscreenElement === target.current);
    setFullscreen(active);
    if (target.current) target.current.dataset.immersive = String(active);
    if (!active) { generation.current += 1; pending.current = false; setBusy(false); unlock(); }
  }, [target, unlock]);

  useEffect(() => {
    mounted.current = true;
    sync();
    const changed = () => { sync(); setMessage(''); };
    const error = () => { sync(); setMessage('Fullscreen was not allowed. You can keep exploring in the current view.'); };
    const orientation = () => {
      // The viewport, not a resolved lock promise, determines the layout.
      if (window.innerWidth > window.innerHeight) setMessage('');
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('fullscreenerror', error);
    screen.orientation?.addEventListener?.('change', orientation);
    window.addEventListener('orientationchange', orientation);
    window.addEventListener('resize', orientation);
    return () => {
      mounted.current = false; generation.current += 1; unlock();
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('fullscreenerror', error);
      screen.orientation?.removeEventListener?.('change', orientation);
      window.removeEventListener('orientationchange', orientation);
      window.removeEventListener('resize', orientation);
    };
  }, [sync, unlock]);

  const enter = async () => {
    if (pending.current || !target.current) return;
    pending.current = true; setBusy(true); setMessage('');
    const element = target.current;
    let operation = ++generation.current;
    try {
      if (typeof element.requestFullscreen !== 'function' || document.fullscreenEnabled === false) {
        setMessage('Fullscreen is unavailable in this browser. You can still explore; turn your phone sideways for a wider view.');
        return;
      }
      // Keep this request directly in the tap handler to retain user activation.
      await element.requestFullscreen({ navigationUI: 'hide' });
      if (!mounted.current) return;
      if (document.fullscreenElement !== element) {
        sync(); setMessage('Fullscreen did not start. You can continue exploring normally.'); return;
      }
      sync();
      operation = generation.current;
      const orientation = screen.orientation as LockableOrientation | undefined;
      if (typeof orientation?.lock !== 'function') {
        if (window.innerHeight > window.innerWidth) setMessage('Fullscreen is on. Turn your phone sideways for landscape; automatic rotation locking is unavailable.');
        return;
      }
      try {
        await orientation.lock('landscape');
        if (!mounted.current || operation !== generation.current || document.fullscreenElement !== element) {
          try { if (!ownsLock.current) orientation.unlock?.(); } catch { /* The browser may already have released it. */ }
          return;
        }
        ownsLock.current = true;
        if (window.innerHeight > window.innerWidth) setMessage('Fullscreen is on. If the screen stays upright, turn your phone sideways for landscape.');
      } catch {
        if (mounted.current && operation === generation.current && document.fullscreenElement === element && window.innerHeight > window.innerWidth) {
          setMessage('Fullscreen is on, but landscape locking was not allowed. Turn your phone sideways, or keep exploring in portrait.');
        }
      }
    } catch {
      if (mounted.current && operation === generation.current) { sync(); setMessage('Fullscreen could not start. You can keep exploring here; try turning your phone sideways.'); }
    } finally {
      if (operation === generation.current) {
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  };
  const exit = async () => {
    if (document.fullscreenElement !== target.current) { sync(); return; }
    generation.current += 1; unlock();
    try {
      await document.exitFullscreen();
      if (mounted.current) sync();
    } catch {
      if (mounted.current) { sync(); setMessage('Could not exit fullscreen. Use your browser’s fullscreen control or Back gesture to leave.'); }
    }
  };
  return { fullscreen, busy, message, enter, exit, dismissMessage: () => setMessage('') };
}


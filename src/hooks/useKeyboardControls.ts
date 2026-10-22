import { useEffect } from 'react';
import type { ControlState } from '../controls';

const TRACKED_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export function useKeyboardControls(controls: ControlState) {
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const update = () => {
      let x = 0;
      let y = 0;
      if (keys['w'] || keys['arrowup']) y += 1;
      if (keys['s'] || keys['arrowdown']) y -= 1;
      if (keys['a'] || keys['arrowleft']) x -= 1;
      if (keys['d'] || keys['arrowright']) x += 1;
      controls.keyboardX = x;
      controls.keyboardY = y;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (TRACKED_KEYS.includes(key)) {
        if (controls.paused) return;
        e.preventDefault();
        keys[key] = true;
        update();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (TRACKED_KEYS.includes(key)) {
        keys[key] = false;
        update();
      }
    };

    const onBlur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
      update();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [controls]);
}

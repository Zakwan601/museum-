import { useEffect, useRef, useState } from 'react';
import type { CameraState, ControlState } from '../controls';

export default function ControlTutorial({ onClose, controls, cameraState }: { onClose: () => void; controls: ControlState; cameraState: CameraState }) {
  const [step, setStep] = useState(0);
  const [touch, setTouch] = useState(() => matchMedia('(pointer: coarse)').matches);
  const progress = useRef({ moved: 0, advanced: false, looked: false, azimuth: cameraState.azimuth, pitch: cameraState.pitch });
  useEffect(() => {
    const media = matchMedia('(pointer: coarse)');
    const update = () => setTouch(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    let frame = 0, last = performance.now();
    const check = (now: number) => {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const p = progress.current;
      if (!controls.paused && !cameraState.inputLocked) {
        if (Math.hypot(controls.keyboardX, controls.keyboardY, controls.joystickX, controls.joystickY) > .15) p.moved += dt;
        if (Math.abs(cameraState.azimuth - p.azimuth) + Math.abs(cameraState.pitch - p.pitch) > .08) p.looked = true;
        if (p.moved > .12) {
          if (p.looked) { onClose(); return; }
          if (!p.advanced) { p.advanced = true; setStep(1); }
        }
      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, [controls, cameraState, onClose]);
  return <p className="control-tutorial" data-step={step ? 'look' : 'move'} data-touch={touch} role="status" aria-live="polite">
    {step ? touch ? 'Swipe the scene to look around' : 'Hold left click and drag to look around' : touch ? 'Drag the joystick to walk' : 'Use 𝕎, 𝔸, 𝕊, 𝔻 to walk'}
  </p>;
}

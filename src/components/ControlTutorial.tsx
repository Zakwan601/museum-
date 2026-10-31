import { useEffect, useRef, useState } from 'react';
import type { CameraState, ControlState } from '../controls';

export default function ControlTutorial({ onClose, controls, cameraState, nearPhoto = false }: { onClose: () => void; controls: ControlState; cameraState: CameraState; nearPhoto?: boolean }) {
  const [step, setStep] = useState(0);
  const [touch, setTouch] = useState(() => matchMedia('(pointer: coarse)').matches);
  const progress = useRef({ moved: 0, stage: 0, azimuth: cameraState.azimuth, pitch: cameraState.pitch });
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
        if (p.stage === 0 && p.moved > .12) {
          p.stage = 1; p.azimuth = cameraState.azimuth; p.pitch = cameraState.pitch;
          setStep(1);
        } else if (p.stage === 1 && Math.abs(cameraState.azimuth - p.azimuth) + Math.abs(cameraState.pitch - p.pitch) > .08) {
          p.stage = 2; setStep(2);
        }

      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, [controls, cameraState, onClose]);
  useEffect(() => { if (step === 2 && nearPhoto) onClose(); }, [step, nearPhoto, onClose]);
  return <div className="control-tutorial" data-step={step === 2 ? 'explore' : step === 1 ? 'look' : 'move'} data-touch={touch} role="status" aria-live="polite">
    {step === 1 && touch && <svg className="tutorial-swipe" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="swipe-arrows" d="M9 21C18 5 61 5 71 21M9 21l1-10M9 21l11-2M71 21l-1-10M71 21l-11-2" />
      <g className="swipe-hand"><path d="M29 53l-8-12c-3-5 2-8 5-4l5 6V23c0-6 7-6 7 0v12-4c0-5 7-5 7 0v5-2c0-4 7-4 7 0v4-1c0-4 7-4 7 0v7c0 6-3 11-5 13H34z" fill="#f8d3df" fillOpacity=".32" /><path d="M31 27c-5-7 0-15 5-15s10 8 5 15" opacity=".35" /></g>
    </svg>}
    <span>{step === 2 ? 'Walk up to the wall photos to explore' : step === 1 ? touch ? 'Swipe the scene to look around' : 'Hold left click and drag to look around' : touch ? 'Drag the joystick to walk' : 'Use W, A, S, D to walk'}</span>
  </div>;
}

import { useCallback, useEffect, useRef } from 'react';
import type { ControlState } from '../controls';
interface Props { controls: ControlState; disabled?: boolean }
export default function VirtualJoystick({ controls, disabled = false }: Props) {
  const base = useRef<HTMLDivElement>(null), knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0, radius: 36 });
  const reset = useCallback(() => {
    const active = pointer.current; pointer.current = null;
    controls.joystickX = controls.joystickY = 0;
    if (knob.current) knob.current.style.transform = 'translate(-50%, -50%)';
    if (base.current) { base.current.dataset.active = 'false'; if (active !== null && base.current.hasPointerCapture(active)) base.current.releasePointerCapture(active); }
  }, [controls]);
  useEffect(() => {
    if (disabled) reset();
    window.addEventListener('blur', reset);
    const visibility = () => { if (document.hidden) reset(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', reset);
    return () => { reset(); window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('resize', reset); };
  }, [disabled, reset]);
  const move = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    e.preventDefault(); e.stopPropagation();
    const dx = e.clientX - center.current.x, dy = e.clientY - center.current.y;
    const distance = Math.hypot(dx, dy), factor = Math.min(1, center.current.radius / Math.max(distance, .001));
    const x = dx * factor, y = dy * factor;
    controls.joystickX = x / center.current.radius; controls.joystickY = -y / center.current.radius;
    if (knob.current) knob.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  };
  return <div ref={base} className="virtual-joystick" role="group" aria-label="Movement joystick" data-active="false"
    onContextMenu={e => e.preventDefault()}
    onPointerDown={e => {
      if (disabled || controls.paused || pointer.current !== null || e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: rect.width * .32 };
      pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.dataset.active = 'true'; move(e);
    }} onPointerMove={move} onPointerUp={e => { if (pointer.current === e.pointerId) reset(); }} onPointerCancel={reset} onLostPointerCapture={reset}>
    <div className="joystick-ring" /><div ref={knob} className="joystick-knob" />
  </div>;
}

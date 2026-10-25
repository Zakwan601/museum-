import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { LOVE_LETTER_TEXT } from '../lib/loveLetter';

export default function LoveLetter({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  const [count, setCount] = useState(reducedMotion ? LOVE_LETTER_TEXT.length : 0);
  const dialog = useRef<HTMLElement>(null), close = useRef<HTMLButtonElement>(null);
  const complete = count === LOVE_LETTER_TEXT.length;
  useEffect(() => {
    if (complete) return;
    if (reducedMotion) { setCount(LOVE_LETTER_TEXT.length); return; }
    const started = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(LOVE_LETTER_TEXT.length, Math.floor((performance.now() - started) / 32));
      setCount(previous => Math.max(previous, next));
      if (next === LOVE_LETTER_TEXT.length) clearInterval(timer);
    }, 64);
    return () => clearInterval(timer);
  }, [reducedMotion, complete]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab') return;
      const items = dialog.current?.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="photo-modal-backdrop love-letter-backdrop" onClick={onClose}>
    <section ref={dialog} className="love-letter" role="dialog" aria-modal="true" aria-labelledby="love-letter-title" onClick={e => e.stopPropagation()}>
      <button ref={close} type="button" className="photo-card-close" aria-label="Close love letter" onClick={onClose}><X size={22} /></button>
      <div className="love-letter-scroll" tabIndex={0} aria-label="Love letter">
        <div className="letter-flourish" aria-hidden="true">&#10087; &#9825; &#10087;</div>
        <h2 id="love-letter-title">A Little Secret</h2>
        <p className="sr-only">{LOVE_LETTER_TEXT}</p>
        <button type="button" className="letter-writing" aria-label={complete ? 'Letter fully revealed' : 'Reveal the full letter'} onClick={() => setCount(LOVE_LETTER_TEXT.length)}>
          <span className="letter-layout" aria-hidden="true">{LOVE_LETTER_TEXT}</span>
          <span className="letter-ink" aria-hidden="true">{LOVE_LETTER_TEXT.slice(0, count)}{!complete && <span className="letter-caret">&#10022;</span>}</span>
        </button>
        {!complete && <button type="button" className="letter-skip" onClick={() => setCount(LOVE_LETTER_TEXT.length)}>Tap to read it all</button>}
        <div className="letter-flourish" aria-hidden="true">&#10087;</div>
      </div>
      <footer><button type="button" className="letter-keep" onClick={onClose}>Keep this close &#9825;</button></footer>
    </section>
  </div>;
}

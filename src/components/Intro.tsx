import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';

const wishes = [
  'I love you.',
  'so soo sooo soo much.',
  'Here’s a little something for our little memories,',
  'and a lifetime of making more  InShaAllah.',
];

export default function Intro({ onEnter, onEnterRequest, reducedMotion }: { onEnter: () => void; onEnterRequest?: () => void; reducedMotion: boolean }) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!started) return;
    title.current?.focus();
    const timer = window.setTimeout(() => setReady(true), reducedMotion ? 0 : wishes.length * 1400);
    return () => clearTimeout(timer);
  }, [started, reducedMotion]);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onEnter, reducedMotion ? 0 : 650);
    return () => clearTimeout(timer);
  }, [leaving, onEnter, reducedMotion]);
  return <main className={`intro ${started ? 'intro-started' : ''} ${leaving ? 'intro-leaving' : ''}`} aria-label="A wish for our anniversary" aria-busy={leaving}>
    <div className="intro-stars" aria-hidden="true">{Array.from({ length: 38 }, (_, i) => <i key={i} style={{ left: `${(i * 37.7 + 9) % 100}%`, top: `${(i * 23.3 + 7) % 100}%`, animationDelay: `${i % 7 * .6}s`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3 }} />)}</div>
    <div className="intro-content">
      {!started ? <div className="intro-invitation">
        <button type="button" className="intro-star" onClick={() => setStarted(true)} aria-label="Tap the glowing star to begin"><Star size={76} strokeWidth={1} fill="currentColor" /></button>
        <h1>Happy 7 year Anniversary Motuuuu <br />My sweetest baby girl</h1>
        <h3>Tap the star to begin</h3>
      </div> : <section className="intro-wishes" aria-labelledby="intro-title">
        
        <h1 id="intro-title" ref={title} tabIndex={-1}>Happy anniversary</h1>
        <div className="intro-lines">{wishes.map((line, i) => <p className="intro-line" key={line} style={{ animationDelay: reducedMotion ? '0s' : `${i * 1.4}s` }}>
          <span>{line}</span><span className="intro-line-sparkles" aria-hidden="true" style={{ animationDelay: reducedMotion ? '0s' : `${i * 1.4 + .5}s` }}>✧<b>✦</b>✧</span>
        </p>)}</div>
        <div className="intro-enter-slot">{ready && <button type="button" className="intro-enter" disabled={leaving} onClick={() => { onEnterRequest?.(); setLeaving(true); }}>Choloooooo ghure ashi, Jabe? </button>}</div>
      </section>}
    </div>
  </main>;
}

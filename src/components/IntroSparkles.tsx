import type { CSSProperties } from 'react';

// A small React-rendered SVG layer; CSS handles the twinkle without frame updates.
const glints = Array.from({ length: 6 }, (_, i) => {
  const angle = i / 6 * Math.PI * 2 + .14;
  const radius = i % 3 === 0 ? 104 : 88;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .75, size: i % 3 === 0 ? 1 : .62, color: ['#ffe3a5', '#f4bdd4', '#fff4df'][i % 3] };
});

export default function IntroSparkles({ reducedMotion }: { reducedMotion: boolean }) {
  return <svg className={`intro-glints ${reducedMotion ? 'is-still' : ''}`} viewBox="-120 -100 240 200" aria-hidden="true" focusable="false">
    {glints.map((glint, i) => <g key={i} transform={`translate(${glint.x} ${glint.y}) scale(${glint.size})`}>
      <path className="intro-glint" fill={glint.color} d="M0-9Q1.8-1.8 9 0Q1.8 1.8 0 9Q-1.8 1.8-9 0Q-1.8-1.8 0-9Z" style={{ '--glint-delay': `${-i * .37}s`, '--glint-duration': `${2.6 + i % 4 * .45}s` } as CSSProperties} />
    </g>)}
  </svg>;
}

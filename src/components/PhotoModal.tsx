import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { PhotoConfig } from '../config';
interface Props { photo: PhotoConfig; onClose: () => void }
export default function PhotoModal({ photo, onClose }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = dialog.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex="0"]');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="photo-modal-backdrop" onClick={onClose}>
    <div ref={dialog} className="photo-modal" role="dialog" aria-modal="true" aria-labelledby="photo-title" onClick={e => e.stopPropagation()}>
      <header className="photo-modal-header"><div className="min-w-0"><h2 id="photo-title" className="text-lg text-rose-100">{photo.title}</h2><p className="mt-1 text-xs text-rose-100/60">{photo.date}</p></div><button ref={close} type="button" className="hud-button" onClick={onClose} aria-label="Close"><X size={22} /></button></header>
      <div className="photo-modal-scroll" tabIndex={0} aria-label="Photo and memory">
        <img src={photo.url} alt={photo.title} decoding="async" className="photo-modal-image" />
        <p className="photo-caption">&ldquo;{photo.caption}&rdquo;</p>
      </div>
    </div>
  </div>;
}

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { PhotoConfig } from '../config';
import { isBook } from '../lib/books';
interface Props { photo: PhotoConfig; onClose: () => void }
export default function PhotoModal({ photo, onClose }: Props) {
  const book = isBook(photo) ? photo : null;
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
    <div ref={dialog} className={`photo-modal vintage-photo ${book ? 'book-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="photo-title" onClick={e => e.stopPropagation()}>
      <button ref={close} type="button" className="photo-card-close" onClick={onClose} aria-label="Close"><X size={23} /></button>
      <div className="photo-modal-scroll" tabIndex={0} aria-label="Photo and memory">
        {book ? <figure className="vintage-print">
          <h2 id="photo-title" className="sr-only" lang="bn">{book.title}</h2>
          <img src={photo.url} alt={`${book.title} - ${book.author}`} decoding="async" className="photo-modal-image book-cover" />
          <figcaption className="vintage-caption"><p className="photo-caption">{photo.caption}</p></figcaption>
        </figure> : <figure className="vintage-print">
          <img src={photo.url} alt={photo.title} decoding="async" className="photo-modal-image" />
          <figcaption className="vintage-caption">
            <h2 id="photo-title">{photo.title}</h2>
            <p className="vintage-date">{photo.date}</p>
            <p className="photo-caption">{photo.caption}</p>
          </figcaption>
        </figure>}

      </div>
    </div>
  </div>;
}

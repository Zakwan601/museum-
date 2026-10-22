import { Expand, Minimize, X } from 'lucide-react';
import type { RefObject } from 'react';
import { useImmersiveMode } from '../hooks/useImmersiveMode';

interface Props { target: RefObject<HTMLElement>; enabled: boolean; modalOpen: boolean; hideEntry: boolean }
export default function ImmersiveMode({ target, enabled, modalOpen, hideEntry }: Props) {
  const { fullscreen, busy, message, enter, exit, dismissMessage } = useImmersiveMode(target);
  if (!enabled && !fullscreen) return null;
  return <div className={`immersive-ui ${fullscreen ? 'is-fullscreen' : ''} ${modalOpen ? 'over-modal' : ''}`}>
    {fullscreen ? <button type="button" className="hud-button immersive-exit" aria-label="Exit fullscreen" title="Exit fullscreen" onClick={() => void exit()}><Minimize size={19} /></button> : !modalOpen && !hideEntry && <button type="button" className="immersive-entry" onClick={() => void enter()} disabled={busy}>
      <Expand size={20} aria-hidden="true" />
      <span>{busy ? 'Opening immersive view…' : 'Enter Immersive Mode'}</span>
    </button>}
    {message && (!hideEntry || fullscreen) && <div className="immersive-message" role="status" aria-live="polite"><p>{message}</p><button type="button" aria-label="Dismiss immersive mode message" onClick={dismissMessage}><X size={17} /></button></div>}
  </div>;
}

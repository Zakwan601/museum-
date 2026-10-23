import { Expand, Minimize, X } from 'lucide-react';
import type { useImmersiveMode } from '../hooks/useImmersiveMode';

interface Props { mode: ReturnType<typeof useImmersiveMode>; enabled: boolean; modalOpen: boolean; hideEntry: boolean; hideMessage?: boolean }
export default function ImmersiveMode({ mode, enabled, modalOpen, hideEntry, hideMessage = false }: Props) {
  const { fullscreen, busy, message, enter, exit, dismissMessage } = mode;
  if (!enabled && !fullscreen) return null;
  return <div className={`immersive-ui ${fullscreen ? 'is-fullscreen' : ''} ${modalOpen ? 'over-modal' : ''}`}>
    {fullscreen ? <button type="button" className="hud-button immersive-exit" aria-label="Exit fullscreen" title="Exit fullscreen" onClick={() => void exit()}><Minimize size={19} /></button> : !modalOpen && !hideEntry && <button type="button" className="immersive-entry" onClick={() => void enter()} disabled={busy}>
      <Expand size={20} aria-hidden="true" />
      <span>{busy ? 'Opening immersive view…' : 'Enter Immersive Mode'}</span>
    </button>}
    {message && !hideMessage && (!hideEntry || fullscreen) && <div className="immersive-message" role="status" aria-live="polite"><p>{message}</p><button type="button" aria-label="Dismiss immersive mode message" onClick={dismissMessage}><X size={17} /></button></div>}
  </div>;
}

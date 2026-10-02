import { useEffect, useState } from 'preact/hooks';
import { canSpeak, onVoicesChanged, speakPali } from '../audio/speech.ts';

/** Whether this device can say Pali, re-checked as its voices finish loading. */
export function useCanSpeak(): boolean {
  const [available, setAvailable] = useState(canSpeak);
  useEffect(() => onVoicesChanged(() => { setAvailable(canSpeak()); }), []);
  return available;
}

/**
 * Tap to hear the word. Never plays on its own (§5 — the session is a sit;
 * no surprise sounds), and renders nothing when the device has no voice
 * that can say Pali faithfully.
 */
export function SpeakButton(props: { pali: string; label?: string }) {
  const { pali, label = 'hear it' } = props;
  const available = useCanSpeak();

  if (!available) return null;
  return (
    <button
      type="button"
      class="btn quiet speak"
      aria-label={`hear ${pali} pronounced`}
      onClick={() => { speakPali(pali); }}
    >
      🔈 {label}
    </button>
  );
}

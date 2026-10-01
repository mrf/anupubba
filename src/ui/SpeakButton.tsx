import { useEffect, useState } from 'preact/hooks';
import { canSpeak, onVoicesChanged, speakPali } from '../audio/speech.ts';

/**
 * Tap to hear the word. Never plays on its own (§5 — the session is a sit;
 * no surprise sounds), and renders nothing when the device has no voice
 * that can say Pali faithfully.
 */
export function SpeakButton(props: { pali: string }) {
  const { pali } = props;
  const [available, setAvailable] = useState(canSpeak);

  useEffect(() => onVoicesChanged(() => { setAvailable(canSpeak()); }), []);

  if (!available) return null;
  return (
    <button
      type="button"
      class="btn quiet speak"
      aria-label={`hear ${pali} pronounced`}
      onClick={() => { speakPali(pali); }}
    >
      🔈 hear it
    </button>
  );
}

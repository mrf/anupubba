import { playPronunciation } from '../audio/pronounce.ts';
import type { WordCard } from '../data/types.ts';

/**
 * Tap to hear the word. Never plays on its own (§5 — the session is a sit;
 * no surprise sounds).
 */
export function SpeakButton(props: { word: Pick<WordCard, 'id' | 'pali'> }) {
  const { word } = props;
  return (
    <button
      type="button"
      class="btn quiet speak"
      aria-label={`hear ${word.pali} pronounced`}
      onClick={() => { playPronunciation(word.id); }}
    >
      🔈 hear it
    </button>
  );
}

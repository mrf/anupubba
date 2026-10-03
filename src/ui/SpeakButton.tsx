import { useEffect, useState } from 'preact/hooks';
import { onVoicesChanged, speakWord, speechMode } from '../audio/speech.ts';
import type { WordCard } from '../data/types.ts';

/**
 * Tap to hear the word. Never plays on its own (§5 — the session is a sit;
 * no surprise sounds). Without an Indic voice it reads the English guide,
 * says so, and (where `tip` is set) shows how to add a Hindi voice.
 */
export function SpeakButton(props: {
  word: Pick<WordCard, 'pali' | 'pronunciation'>;
  tip?: boolean;
}) {
  const { word, tip = false } = props;
  const [mode, setMode] = useState(speechMode);

  useEffect(() => onVoicesChanged(() => { setMode(speechMode()); }), []);

  if (mode === 'none') return null;
  const approximate = mode === 'approximate';
  return (
    <>
      <button
        type="button"
        class="btn quiet speak"
        aria-label={`hear ${word.pali} pronounced${approximate ? ', approximately' : ''}`}
        onClick={() => { speakWord(word); }}
      >
        🔈 hear it{approximate && ' (approximate)'}
      </button>
      {approximate && tip && (
        <details class="speak-tip">
          <summary>for true Pali sounds, add a Hindi voice</summary>
          <ul>
            <li>iPhone / iPad: Settings → Accessibility → Spoken Content → Voices → Hindi</li>
            <li>Android: Settings → Text-to-speech → Google engine → Install voice data → Hindi</li>
            <li>Windows: Settings → Time &amp; language → Speech → Add voices → Hindi (India)</li>
            <li>Mac: System Settings → Accessibility → Spoken Content → System voice → Manage Voices → Hindi</li>
          </ul>
          <p>Then reload the app. Chrome and Edge pick up new voices most reliably.</p>
        </details>
      )}
    </>
  );
}

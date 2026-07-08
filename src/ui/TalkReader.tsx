import { useState } from 'preact/hooks';
import type { Catalog, Deck } from '../data/types.ts';

/**
 * Talk mode (§3.4): a short paragraph the way teachers actually speak, each
 * Pali term tappable for its gloss. Tapping quietly logs a not-yet; reading
 * through clean logs comprehension reps — both handled by the caller.
 */
export function TalkReader(props: {
  deck: Deck;
  catalog: Catalog;
  onTap: (wordId: string) => void;
  onFinish: (tapped: ReadonlySet<string>) => void;
}) {
  const { deck, catalog, onTap, onFinish } = props;
  const [tapped, setTapped] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);

  function tap(wordId: string) {
    setOpen((current) => (current === wordId ? null : wordId));
    if (!tapped.has(wordId)) {
      setTapped(new Set(tapped).add(wordId));
      onTap(wordId);
    }
  }

  const openWord = open === null ? undefined : catalog.words.get(open);

  return (
    <section class="card talk">
      <h2>{deck.name}</h2>
      <p class="talk-hint">read at your own pace — tap any term you're unsure of</p>
      <p class="talk-body">
        {deck.talk.map((segment, index) =>
          segment.kind === 'text' ? (
            <span key={index}>{segment.text}</span>
          ) : (
            <button
              key={index}
              class={`term${tapped.has(segment.term) ? ' tapped' : ''}`}
              onClick={() => { tap(segment.term); }}
            >
              {segment.surface}
            </button>
          ),
        )}
      </p>
      {openWord !== undefined && (
        <p class="talk-gloss">
          <strong>{openWord.pali}</strong> — {openWord.gloss}
        </p>
      )}
      <button class="btn primary" onClick={() => { onFinish(tapped); }}>
        finished reading
      </button>
    </section>
  );
}

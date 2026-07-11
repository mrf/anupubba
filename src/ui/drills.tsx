import { useState } from 'preact/hooks';
import type { WordCard } from '../data/types.ts';
import { matchesPali, matchesPaliLoosely } from '../engine/match.ts';
import { shuffled } from '../engine/distractors.ts';
import type { SessionGrade } from '../engine/srs.ts';

/** The part of the gloss short enough for an option button. */
export function shortGloss(word: WordCard): string {
  return word.gloss.split(';')[0] ?? word.gloss;
}

export function IntroCard(props: { word: WordCard; onDone: () => void }) {
  const { word, onDone } = props;
  return (
    <section class="card intro">
      <p class="pali-big">{word.pali}</p>
      <p class="pronunciation">{word.pronunciation}</p>
      <p class="gloss">{word.gloss}</p>
      {word.literal !== undefined && (
        <p class="literal">
          literally: <em>{word.literal}</em>
        </p>
      )}
      {word.etymology !== undefined && (
        <p class="etymology">
          {word.etymology.root} — {word.etymology.note}
        </p>
      )}
      {word.canonicalLine !== undefined && (
        <blockquote class="canonical">
          <p lang="pi">{word.canonicalLine.pali}</p>
          <p>“{word.canonicalLine.translation}”</p>
          <cite>{word.canonicalLine.ref}</cite>
        </blockquote>
      )}
      <p class="sources">
        {word.sources.map((source) => (
          <a key={source.ref} href={source.url} target="_blank" rel="noopener noreferrer">
            {source.ref}
          </a>
        ))}
      </p>
      <button class="btn primary" onClick={onDone}>
        continue
      </button>
    </section>
  );
}

/**
 * Recognition and discrimination share this shape (§3.3 — discrimination is
 * what recognition drills become). Grading is objective here: a correct pick
 * logs familiar, a miss logs not yet. No red X anywhere (§2).
 */
export function RecognitionDrill(props: {
  word: WordCard;
  distractors: readonly WordCard[];
  onDone: (grade: SessionGrade) => void;
}) {
  const { word, distractors, onDone } = props;
  const [options] = useState(() => shuffled([word, ...distractors], Math.random));
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === word.id;

  if (picked !== null) {
    return (
      <section class="card drill">
        <p class="pali-big">{word.pali}</p>
        <p class={correct ? 'feedback clear' : 'feedback not-yet'}>
          {correct ? word.gloss : `not yet — ${word.pali} is ${shortGloss(word)}`}
        </p>
        {!correct && <p class="literal">you chose: {shortGloss(pickedWord(options, picked))}</p>}
        <button class="btn primary" onClick={() => { onDone(correct ? 'familiar' : 'notYet'); }}>
          continue
        </button>
      </section>
    );
  }

  return (
    <section class="card drill">
      <p class="pali-big">{word.pali}</p>
      <div class="options">
        {options.map((option) => (
          <button key={option.id} class="btn option" onClick={() => { setPicked(option.id); }}>
            {shortGloss(option)}
          </button>
        ))}
      </div>
    </section>
  );
}

function pickedWord(options: readonly WordCard[], id: string): WordCard {
  const found = options.find((o) => o.id === id);
  if (found === undefined) throw new Error(`picked option "${id}" not among options`);
  return found;
}

/**
 * Recall: produce the word from its gloss. Sound-forgiving (§3.2): plain
 * ASCII always counts, and a spelling that only misses what can't be heard —
 * doubling, aspiration, nasal place — counts too, with a nudge. The correct
 * diacritics are always shown after. A correct answer self-grades
 * familiar/clear — honesty is part of the practice.
 */
export function RecallDrill(props: {
  word: WordCard;
  onDone: (grade: SessionGrade) => void;
}) {
  const { word, onDone } = props;
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const matched = matchesPali(input, word.pali);
  const close = !matched && matchesPaliLoosely(input, word.pali);

  if (revealed) {
    return (
      <section class="card drill">
        <p class="gloss">{word.gloss}</p>
        <p class="pali-big">{word.pali}</p>
        <p class="pronunciation">{word.pronunciation}</p>
        {matched || close ? (
          <>
            {close && (
              <p class="feedback clear">close — the sounds are right; let the spelling settle in</p>
            )}
            <div class="options">
              <button class="btn option" onClick={() => { onDone('familiar'); }}>
                familiar
              </button>
              <button class="btn option" onClick={() => { onDone('clear'); }}>
                clear
              </button>
            </div>
          </>
        ) : (
          <>
            <p class="feedback not-yet">not yet — it will come around again</p>
            <button class="btn primary" onClick={() => { onDone('notYet'); }}>
              continue
            </button>
          </>
        )}
      </section>
    );
  }

  return (
    <section class="card drill">
      <p class="gloss">{word.gloss}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setRevealed(true);
        }}
      >
        <input
          class="recall-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          placeholder="type the Pali word — plain letters are fine"
          value={input}
          onInput={(event) => { setInput((event.target as HTMLInputElement).value); }}
        />
        <button class="btn primary" type="submit">
          check
        </button>
      </form>
    </section>
  );
}

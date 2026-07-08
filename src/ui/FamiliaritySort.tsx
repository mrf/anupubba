import { useState } from 'preact/hooks';
import type { Catalog } from '../data/types.ts';
import type { FamiliarityLevel } from '../engine/srs.ts';

/**
 * The front door (§4.2): two minutes of know it / heard it / new to me,
 * seeding the whole SRS state. Respects prior contact with the teachings.
 */
export function FamiliaritySort(props: {
  catalog: Catalog;
  onDone: (answers: ReadonlyMap<string, FamiliarityLevel>) => void;
}) {
  const { catalog, onDone } = props;
  const [index, setIndex] = useState(0);
  const [answers] = useState(() => new Map<string, FamiliarityLevel>());

  const wordId = catalog.familiarity[index];
  const word = wordId === undefined ? undefined : catalog.words.get(wordId);
  if (wordId === undefined || word === undefined) return null;

  function answer(level: FamiliarityLevel) {
    if (wordId !== undefined) answers.set(wordId, level);
    if (index + 1 >= catalog.familiarity.length) {
      onDone(answers);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <main class="screen">
      <header class="screen-head">
        <h1>before we begin</h1>
        <p>
          You've likely met many of these words in talks already. Sort them honestly — this
          seeds what the app shows you first.
        </p>
      </header>
      <section class="card sort">
        <p class="count">
          {index + 1} of {catalog.familiarity.length}
        </p>
        <p class="pali-big">{word.pali}</p>
        <div class="options">
          <button class="btn option" onClick={() => { answer('know'); }}>
            know it
          </button>
          <button class="btn option" onClick={() => { answer('heard'); }}>
            heard it
          </button>
          <button class="btn option" onClick={() => { answer('new'); }}>
            new to me
          </button>
        </div>
      </section>
    </main>
  );
}

import { useState } from 'preact/hooks';

interface SyllableDrill {
  word: string;
  syllables: readonly string[];
  /** Index of the long syllable. */
  answer: number;
}

interface Page {
  title: string;
  points: readonly string[];
  drill: SyllableDrill;
}

/**
 * Lesson 0 (§4.1): Pali is phonetically regular, so five minutes here pays
 * off across the whole app — and justifies the later diacritic drills.
 */
const PAGES: readonly Page[] = [
  {
    title: 'the long vowels',
    points: [
      'A line over a vowel — ā, ī, ū — means hold it twice as long. The line means linger.',
      'samādhi is sa-MAA-dhi: the mā carries the weight.',
      'Every other vowel is short and light.',
    ],
    drill: { word: 'samādhi', syllables: ['sa', 'mā', 'dhi'], answer: 1 },
  },
  {
    title: 'c, ñ, and the hum',
    points: [
      'c always sounds like “ch”: vicāra is vi-CHAA-ra.',
      'ñ is the Spanish ñ: paññā is PUN-yaa.',
      'ṃ is a nasal hum through the nose, as in saṃsāra.',
    ],
    drill: { word: 'mettā', syllables: ['met', 'tā'], answer: 1 },
  },
  {
    title: 'the tongue and the breath',
    points: [
      'Dots under ṭ, ḍ, ṇ curl the tongue back against the roof of the mouth: taṇhā.',
      'kh, gh, th, dh, bh, ph add a puff of breath — dukkha is duk-kha, never “duck-a”.',
      'Doubled consonants are truly doubled: hold them a beat.',
    ],
    drill: { word: 'nibbāna', syllables: ['nib', 'bā', 'na'], answer: 1 },
  },
];

export function Lesson0(props: { onDone: () => void; onSkip: () => void }) {
  const { onDone, onSkip } = props;
  const [pageIndex, setPageIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const page = PAGES[pageIndex];
  if (page === undefined) return null;
  const solved = picked === page.drill.answer;

  function nextPage() {
    setPicked(null);
    if (pageIndex + 1 >= PAGES.length) {
      onDone();
    } else {
      setPageIndex(pageIndex + 1);
    }
  }

  return (
    <main class="screen">
      <header class="screen-head">
        <h1>the sounds</h1>
        <p>
          Pali is written exactly as it sounds. A few minutes here and every word in the app
          becomes pronounceable.
        </p>
      </header>
      <section class="card lesson">
        <h2>{page.title}</h2>
        <ul>
          {page.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p class="drill-prompt">tap the long syllable in</p>
        <div class="options syllables">
          {page.drill.syllables.map((syllable, index) => (
            <button
              key={syllable}
              class={`btn option${picked === index ? (index === page.drill.answer ? ' right' : ' soft') : ''}`}
              onClick={() => { setPicked(index); }}
            >
              {syllable}
            </button>
          ))}
        </div>
        {picked !== null && (
          <p class={solved ? 'feedback clear' : 'feedback not-yet'}>
            {solved
              ? 'yes — the line means linger'
              : 'listen again — the macron (¯) marks the long one'}
          </p>
        )}
        {solved && (
          <button class="btn primary" onClick={nextPage}>
            {pageIndex + 1 >= PAGES.length ? 'done — the sounds are yours' : 'continue'}
          </button>
        )}
      </section>
      <button class="btn quiet" onClick={onSkip}>
        skip for now
      </button>
    </main>
  );
}

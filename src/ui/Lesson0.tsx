import { useState } from 'preact/hooks';

interface SyllableDrill {
  /** Asks for the sound this page just taught. */
  prompt: string;
  syllables: readonly string[];
  /** Index of the syllable carrying that sound. */
  answer: number;
  success: string;
  hint: string;
}

interface Page {
  title: string;
  points: readonly string[];
  drill: SyllableDrill;
}

/**
 * Lesson 0 (§4.1): Pali is phonetically regular, so five minutes here pays
 * off across the whole app — and justifies the later diacritic drills.
 * Each page's micro-drill exercises the sound that page introduces.
 */
const PAGES: readonly Page[] = [
  {
    title: 'the long vowels',
    points: [
      'A line over a vowel — ā, ī, ū — means hold it twice as long. The line means linger.',
      'samādhi is sa-MAA-dhi: the mā carries the weight.',
      'Every other vowel is short and light.',
    ],
    drill: {
      prompt: 'tap the long syllable in samādhi',
      syllables: ['sa', 'mā', 'dhi'],
      answer: 1,
      success: 'yes — the line means linger',
      hint: 'listen again — the macron (¯) marks the long one',
    },
  },
  {
    title: 'c, ñ, and the hum',
    points: [
      'c always sounds like “ch”: vicāra is vi-CHAA-ra.',
      'ñ is the Spanish ñ: paññā is PUN-yaa.',
      'ṃ is a nasal hum through the nose, as in saṃsāra.',
    ],
    drill: {
      prompt: 'tap the syllable that sounds like “chaa” in vicāra',
      syllables: ['vi', 'cā', 'ra'],
      answer: 1,
      success: 'yes — vicāra is vi-CHAA-ra',
      hint: 'listen again — c always sounds like “ch”, never “k” or “s”',
    },
  },
  {
    title: 'the tongue and the breath',
    points: [
      'Dots under ṭ, ḍ, ṇ curl the tongue back against the roof of the mouth: taṇhā.',
      'kh, gh, th, dh, bh, ph add a puff of breath — dukkha is duk-kha, never “duck-a”.',
      'So th is a breathy t — never the th of “thin”: Theravāda is tay-ra-VAA-da. And ph is a breathy p, never “f”: phala is PHA-la.',
      'Doubled consonants are truly doubled: hold them a beat.',
    ],
    drill: {
      prompt: 'tap the syllable with the puff of breath in dukkha',
      syllables: ['duk', 'kha'],
      answer: 1,
      success: 'yes — duk-kha, with a little push of air',
      hint: 'listen again — kh carries the breath, plain k does not',
    },
  },
  {
    title: 'the ng at the back',
    points: [
      'ṅ is the “ng” of “singer”: saṅgha is SUNG-gha, saṅkhāra is sun-KHAA-ra.',
      'Three nasals, three places: ñ at the palate (paññā), ṅ at the back (saṅgha), ṃ humming through the nose (saṃsāra).',
      'Where English would break “n-k” apart, Pali glides: think “sung-KHAA-ra”, not “san-KHAA-ra”.',
    ],
    drill: {
      prompt: 'tap the syllable with the “ng” in saṅkhāra',
      syllables: ['saṅ', 'khā', 'ra'],
      answer: 0,
      success: 'yes — sun-KHAA-ra, the ng gliding into the kh',
      hint: 'listen again — ṅ is the “ng” of “singer”, right at the back',
    },
  },
  {
    title: 'e and o — long without the line',
    points: [
      'e and o are always long, so they never wear a macron: e as in “grey”, o as in “go”.',
      'bodhi is BOH-dhi; deva is DAY-va; mettā — squeezed by the doubled tt — drops to the e of “met”.',
      'So Pali has ten vowels: a, i, u short; ā, ī, ū long; e and o long by nature, shortened only when doubled consonants press in.',
    ],
    drill: {
      prompt: 'tap the long syllable in bodhi',
      syllables: ['bo', 'dhi'],
      answer: 0,
      success: 'yes — BOH-dhi: o is long without any line over it',
      hint: 'listen again — o is long by nature; dhi stays short and light',
    },
  },
  {
    title: 'where the weight falls',
    points: [
      'Pali has no heavy accent like English — the rhythm comes from length alone.',
      'A syllable is heavy when its vowel is long, or when doubled consonants close it: u-PEK-khaa, a-NUT-taa.',
      'Meet a new word by finding its heavy syllables and letting them carry it: nibbāna, viññāṇa, anicca.',
    ],
    drill: {
      prompt: 'tap the heavy syllable in anicca',
      syllables: ['a', 'nic', 'ca'],
      answer: 1,
      success: 'yes — a-NICH-cha: no long vowel anywhere, the doubled cc alone makes it heavy',
      hint: 'listen again — no macrons here; the doubled consonant carries the weight',
    },
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
        <p class="drill-prompt">{page.drill.prompt}</p>
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
            {solved ? page.drill.success : page.drill.hint}
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

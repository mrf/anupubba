/**
 * Romanised Pali → eSpeak NG phoneme string (Hindi phoneme set), used by
 * scripts/gen-audio.ts to render one audio file per word.
 *
 * eSpeak is given phonemes rather than Devanagari because its Hindi and
 * Marathi rules drop a word-final short a (anicca → "anicc") — a Hindi
 * habit, not Pali. Spelling out the phonemes keeps every vowel length,
 * retroflex and aspirate exactly as written. Kept free of imports so the
 * generator script can load it directly.
 */

const VOWELS: Readonly<Record<string, string>> = {
  a: '@', ā: 'a:', i: 'I', ī: 'i:', u: 'U', ū: 'u:', e: 'e:', o: 'o:',
};

const LONG = new Set(['ā', 'ī', 'ū', 'e', 'o']);

/** Aspirates are digraphs so the longest match wins (kh before k). */
const CONSONANTS: Readonly<Record<string, string>> = {
  kh: 'k#', gh: 'g#', ch: 'c#', jh: 'J#', ṭh: 't.#', ḍh: 'd.#', th: 't#', dh: 'd#', ph: 'p#', bh: 'b#',
  k: 'k', g: 'g', ṅ: 'N', c: 'c', j: 'J', ñ: 'n^', ṭ: 't.', ḍ: 'd.', ṇ: 'n.',
  t: 't', d: 'd', n: 'n', p: 'p', b: 'b', m: 'm',
  y: 'j', r: 'r', l: 'l', ḷ: 'l.', v: 'v', s: 's', h: 'H',
};

type Token =
  | { kind: 'consonant'; sound: string }
  | { kind: 'vowel'; letter: string }
  | { kind: 'niggahita' };

function tokenize(word: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < word.length) {
    const two = word.slice(i, i + 2);
    const one = word.charAt(i);
    const sound2 = CONSONANTS[two];
    const sound1 = CONSONANTS[one];
    if (sound2 !== undefined) {
      tokens.push({ kind: 'consonant', sound: sound2 });
      i += 2;
    } else if (sound1 !== undefined) {
      tokens.push({ kind: 'consonant', sound: sound1 });
      i += 1;
    } else if (VOWELS[one] !== undefined) {
      tokens.push({ kind: 'vowel', letter: one });
      i += 1;
    } else if (one === 'ṃ') {
      tokens.push({ kind: 'niggahita' });
      i += 1;
    } else {
      throw new Error(`no phoneme for "${one}" in "${word}"`);
    }
  }
  return tokens;
}

/**
 * Pali stress: the penultimate syllable if heavy (long vowel, or closed by a
 * consonant or ṃ), otherwise the antepenultimate, otherwise the first.
 */
function stressedSyllable(heavy: readonly boolean[]): number {
  const n = heavy.length;
  if (n >= 2 && heavy[n - 2] === true) return n - 2;
  if (n >= 3) return n - 3;
  return 0;
}

function wordPhonemes(word: string): string {
  const tokens = tokenize(word);
  const vowelAt = tokens.flatMap((t, i) => (t.kind === 'vowel' ? [i] : []));
  // A syllable is heavy if its vowel is long or it is closed: ṃ, or two or
  // more consonants before the next vowel (the first closes this syllable).
  const heavy = vowelAt.map((at, s) => {
    const token = tokens[at];
    if (token?.kind === 'vowel' && LONG.has(token.letter)) return true;
    const end = vowelAt[s + 1] ?? tokens.length;
    const following = tokens.slice(at + 1, end);
    if (following.some((t) => t.kind === 'niggahita')) return true;
    return s + 1 < vowelAt.length && following.length >= 2;
  });
  const stressed = stressedSyllable(heavy);
  // The stress mark goes before the stressed syllable's onset: the single
  // consonant right before its vowel (or the vowel itself word-initially).
  const stressAt = (() => {
    const at = vowelAt[stressed] ?? 0;
    return at > 0 && tokens[at - 1]?.kind === 'consonant' ? at - 1 : at;
  })();
  return tokens
    .map((t, i) => {
      const mark = i === stressAt && vowelAt.length > 1 ? "'" : '';
      if (t.kind === 'consonant') return mark + t.sound;
      if (t.kind === 'niggahita') return mark + 'N';
      // Hindi voices use the fuller V for a stressed short a, @ elsewhere.
      if (t.letter === 'a' && vowelAt[stressed] === i && vowelAt.length > 1) return mark + 'V';
      return mark + (VOWELS[t.letter] ?? '');
    })
    .join('');
}

/** The phoneme string for a word; hyphens and spaces separate words. */
export function toPhonemes(pali: string): string {
  return pali
    .normalize('NFC')
    .toLowerCase()
    .replace(/ṁ/g, 'ṃ')
    .split(/[-\s]+/)
    .filter((part) => part !== '')
    .map(wordPhonemes)
    .join(' ');
}

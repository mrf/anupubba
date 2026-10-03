/**
 * Tap-to-hear pronunciation through the browser's own speech engine — no
 * audio assets, no network, nothing leaves the device (§7: dāna, no server).
 *
 * Pali has no voice of its own, but its sounds map one-to-one onto Devanagari,
 * and Indic voices read Devanagari with the retroflexes, aspirates and vowel
 * lengths that English voices flatten. So each word is respelled in Devanagari
 * and handed to the closest Indic voice on the device. Many devices have none
 * (Windows and Firefox ship English voices only), so there an English voice
 * reads the written guide instead — marked approximate, with a tip on adding
 * a Hindi voice, since it flattens retroflexes and aspirates.
 */

const INDEPENDENT_VOWELS: Readonly<Record<string, string>> = {
  a: 'अ', ā: 'आ', i: 'इ', ī: 'ई', u: 'उ', ū: 'ऊ', e: 'ए', o: 'ओ',
};

const VOWEL_SIGNS: Readonly<Record<string, string>> = {
  a: '', ā: 'ा', i: 'ि', ī: 'ी', u: 'ु', ū: 'ू', e: 'े', o: 'ो',
};

/** Aspirates are listed as digraphs so the longest match wins (kh before k). */
const CONSONANTS: Readonly<Record<string, string>> = {
  kh: 'ख', gh: 'घ', ch: 'छ', jh: 'झ', ṭh: 'ठ', ḍh: 'ढ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ',
  k: 'क', g: 'ग', ṅ: 'ङ', c: 'च', j: 'ज', ñ: 'ञ', ṭ: 'ट', ḍ: 'ड', ṇ: 'ण',
  t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब', m: 'म',
  y: 'य', r: 'र', l: 'ल', ḷ: 'ळ', v: 'व', s: 'स', h: 'ह',
};

const NIGGAHITA = 'ं';
const VIRAMA = '्';

/**
 * Romanised Pali → Devanagari. Hyphens and spaces separate words; anything
 * outside the Pali alphabet is passed through untouched.
 */
export function toDevanagari(pali: string): string {
  const text = pali.normalize('NFC').toLowerCase().replace(/ṁ/g, 'ṃ');
  let out = '';
  let pendingConsonant = false;
  let i = 0;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    const one = text.charAt(i);
    const consonant = CONSONANTS[two] !== undefined ? two : CONSONANTS[one] !== undefined ? one : null;
    if (consonant !== null) {
      if (pendingConsonant) out += VIRAMA;
      out += CONSONANTS[consonant] ?? '';
      pendingConsonant = true;
      i += consonant.length;
      continue;
    }
    const vowel = INDEPENDENT_VOWELS[one];
    if (vowel !== undefined) {
      out += pendingConsonant ? (VOWEL_SIGNS[one] ?? '') : vowel;
      pendingConsonant = false;
      i += 1;
      continue;
    }
    if (pendingConsonant) out += VIRAMA;
    pendingConsonant = false;
    if (one === 'ṃ') out += NIGGAHITA;
    else out += one === '-' ? ' ' : one;
    i += 1;
  }
  if (pendingConsonant) out += VIRAMA;
  return out;
}

/** Closest voices first: Sanskrit, then Indic languages that keep its sounds. */
const LANGUAGE_PREFERENCE = ['sa', 'pi', 'hi', 'mr', 'ne'] as const;

function synth(): SpeechSynthesis | null {
  return typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined'
    ? null
    : speechSynthesis;
}

/** The best Indic voice the device offers, or null if there is none. */
export function pickVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const language of LANGUAGE_PREFERENCE) {
    const matching = voices.filter((v) => v.lang.toLowerCase().split(/[-_]/)[0] === language);
    const best = matching.find((v) => v.localService) ?? matching[0];
    if (best !== undefined) return best;
  }
  return null;
}

/**
 * How this device can say a word: `native` through an Indic voice,
 * `approximate` by reading the English respelling, or `none` at all.
 */
export type SpeechMode = 'native' | 'approximate' | 'none';

/** An English voice for the respelling, Indian English first (closest vowels). */
export function pickEnglishVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return (
    english.find((v) => /^en[-_]in$/i.test(v.lang)) ??
    english.find((v) => v.default) ??
    english[0] ??
    null
  );
}

/** The current mode (voices load asynchronously, so re-check on change). */
export function speechMode(): SpeechMode {
  const engine = synth();
  if (engine === null) return 'none';
  const voices = engine.getVoices();
  if (pickVoice(voices) !== null) return 'native';
  return pickEnglishVoice(voices) === null ? 'none' : 'approximate';
}

/**
 * The written guide made speakable: lowercase so stressed syllables aren't
 * spelled out as letters (NICH → N-I-C-H), and "aa" as "ah" so English
 * voices lengthen it.
 */
export function toEnglishRespelling(pronunciation: string): string {
  return pronunciation.toLowerCase().replace(/aa/g, 'ah');
}

/**
 * Call `listener` whenever the device's voice list changes; returns an
 * unsubscribe. Some browsers only populate voices after this event fires.
 */
export function onVoicesChanged(listener: () => void): () => void {
  const engine = synth();
  if (engine === null) return () => undefined;
  engine.addEventListener('voiceschanged', listener);
  return () => { engine.removeEventListener('voiceschanged', listener); };
}

/** Say a word as well as this device can, slowly. Call from a tap. */
export function speakWord(word: { pali: string; pronunciation: string }): void {
  const engine = synth();
  if (engine === null) return;
  const voices = engine.getVoices();
  const indic = pickVoice(voices);
  const voice = indic ?? pickEnglishVoice(voices);
  if (voice === null) return;
  // iOS Safari silently drops a speak() issued straight after cancel(), so
  // only cancel when something is actually queued; resume() unsticks
  // engines (Safari, Chrome) left paused by an earlier interrupted utterance.
  if (engine.speaking || engine.pending) engine.cancel();
  engine.resume();
  const text = indic !== null ? toDevanagari(word.pali) : toEnglishRespelling(word.pronunciation);
  const utterance = makeUtterance(text, voice.lang);
  utterance.voice = voice;
  // A listed voice can still fail (on iOS, one not yet downloaded): retry
  // once by language alone and let the device pick its own voice for it.
  utterance.addEventListener('error', (event) => {
    if (event.error === 'interrupted' || event.error === 'canceled') return;
    engine.speak(makeUtterance(text, voice.lang));
  });
  engine.speak(utterance);
}

function makeUtterance(text: string, lang: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.75;
  return utterance;
}

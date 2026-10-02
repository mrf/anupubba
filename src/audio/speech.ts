/**
 * Tap-to-hear pronunciation through the browser's own speech engine — no
 * audio assets, no network, nothing leaves the device (§7: dāna, no server).
 *
 * Pali has no voice of its own, but its sounds map one-to-one onto Devanagari,
 * and Indic voices read Devanagari with the retroflexes, aspirates and vowel
 * lengths that English voices flatten. So each word is respelled in Devanagari
 * and handed to the closest Indic voice on the device. With no such voice the
 * caller hides the button: better silence than a wrong sound taught as right.
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

/** Whether a suitable voice is available right now (voices load asynchronously). */
export function canSpeak(): boolean {
  const engine = synth();
  return engine !== null && pickVoice(engine.getVoices()) !== null;
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

/** Speak a Pali word, slowly enough to hear each syllable. Call from a tap. */
export function speakPali(pali: string): void {
  const engine = synth();
  if (engine === null) return;
  const voice = pickVoice(engine.getVoices());
  if (voice === null) return;
  // iOS Safari silently drops a speak() issued straight after cancel(), so
  // only cancel when something is actually queued; resume() unsticks
  // engines (Safari, Chrome) left paused by an earlier interrupted utterance.
  if (engine.speaking || engine.pending) engine.cancel();
  engine.resume();
  const text = toDevanagari(pali);
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

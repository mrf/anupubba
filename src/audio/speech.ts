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
 * Call `listener` whenever the device's voice list may have changed; returns
 * an unsubscribe. Voices load asynchronously, and not every browser announces
 * it: older Safari has only `onvoiceschanged`, and iOS sometimes never fires
 * the event at all. So listen either way, and also look again a few times
 * while the list is still filling.
 */
export function onVoicesChanged(listener: () => void): () => void {
  const engine = synth();
  if (engine === null) return () => undefined;
  const target = engine as SpeechSynthesis & Partial<EventTarget>;
  const usesEvents = typeof target.addEventListener === 'function';
  const previous = engine.onvoiceschanged;
  if (usesEvents) {
    engine.addEventListener('voiceschanged', listener);
  } else {
    engine.onvoiceschanged = listener;
  }
  let polls = 0;
  const poll = setInterval(() => {
    polls += 1;
    listener();
    if (polls >= VOICE_POLLS || pickVoice(engine.getVoices()) !== null) clearInterval(poll);
  }, VOICE_POLL_MS);
  return () => {
    clearInterval(poll);
    if (usesEvents) engine.removeEventListener('voiceschanged', listener);
    else engine.onvoiceschanged = previous;
  };
}

const VOICE_POLLS = 12;
const VOICE_POLL_MS = 250;

/**
 * The utterance being spoken. Chrome drops an utterance that nothing refers
 * to mid-speech (its end event never fires and the queue jams), so hold it
 * until it finishes.
 */
let current: SpeechSynthesisUtterance | null = null;

/** Speak romanised Pali, slowly enough to hear each syllable. Call from a tap. */
export function speakPali(pali: string): void {
  const engine = synth();
  if (engine === null) return;
  const voice = pickVoice(engine.getVoices());
  if (voice === null) return;
  const utterance = new SpeechSynthesisUtterance(toDevanagari(pali));
  utterance.voice = voice;
  // Android reports hi_IN; the utterance wants a BCP 47 tag.
  utterance.lang = voice.lang.replace('_', '-');
  utterance.rate = 0.75;
  utterance.onend = () => { if (current === utterance) current = null; };
  utterance.onerror = utterance.onend;
  current = utterance;

  // Chrome can be left paused (e.g. after the tab was backgrounded), which
  // silently queues every later utterance; resuming is harmless otherwise.
  if (engine.paused) engine.resume();
  if (engine.speaking || engine.pending) {
    // Chrome swallows a speak() issued in the same tick as cancel(). Audio
    // is already unlocked here (something was playing), so iOS's
    // must-be-in-a-tap rule is satisfied without the synchronous call.
    engine.cancel();
    setTimeout(() => { if (current === utterance) engine.speak(utterance); }, 60);
  } else {
    engine.speak(utterance);
  }
}

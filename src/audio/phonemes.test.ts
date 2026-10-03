import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog.ts';
import { toPhonemes } from './phonemes.ts';

describe('toPhonemes', () => {
  it.each([
    // The final short a stays — eSpeak's Hindi rules would drop it.
    ['anicca', "@'nIcc@"],
    ['dukkha', "'dUkk#@"],
    // Long vowels, ṅ, retroflex ṇ, ñ.
    ['mettā', "'me:tta:"],
    ['saṅkhāra', "s@N'k#a:r@"],
    ['karuṇā', "'kVrUn.a:"],
    ['paññā', "'pVn^n^a:"],
    // Niggahita, and hyphenated compounds as separate words.
    ['buddhaṃ', "'bUdd#@N"],
    ['sammā-ājīva', "'sVmma: a:'Ji:v@"],
  ])('%s → %s', (pali, phonemes) => {
    expect(toPhonemes(pali)).toBe(phonemes);
  });

  it('stresses a heavy penultimate, else the antepenultimate', () => {
    expect(toPhonemes('nibbāna')).toBe("nIb'ba:n@");
    expect(toPhonemes('vipassanā')).toBe("vI'pVss@na:");
  });

  it('covers every letter of every word in the catalog', () => {
    for (const word of catalog.words.values()) {
      expect(() => toPhonemes(word.pali), word.pali).not.toThrow();
    }
  });
});

describe('pronunciation clips', () => {
  it('exist for every word — run `npm run audio` after adding one', () => {
    const clips = new Set(Object.keys(import.meta.glob('/public/audio/*.mp3')));
    const missing = [...catalog.words.keys()].filter((id) => !clips.has(`/public/audio/${id}.mp3`));
    expect(missing).toEqual([]);
  });
});

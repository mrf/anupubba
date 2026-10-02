import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog.ts';
import { pickVoice, toDevanagari } from './speech.ts';

function voice(lang: string, localService = true): SpeechSynthesisVoice {
  return { lang, localService, name: lang, voiceURI: lang, default: false };
}

describe('toDevanagari', () => {
  it.each([
    ['anicca', 'अनिच्च'],
    ['dukkha', 'दुक्ख'],
    ['mettā', 'मेत्ता'],
    ['saṅkhāra', 'सङ्खार'],
    ['paññā', 'पञ्ञा'],
    ['vedanā', 'वेदना'],
    ['pīti', 'पीति'],
    ['uddhacca', 'उद्धच्च'],
    ['buddhaṃ', 'बुद्धं'],
    ['buddhaṁ', 'बुद्धं'],
    ['sammā-ājīva', 'सम्मा आजीव'],
    ['Nibbāna', 'निब्बान'],
  ])('%s → %s', (pali, devanagari) => {
    expect(toDevanagari(pali)).toBe(devanagari);
  });

  it('keeps aspirates distinct from plain stops', () => {
    expect(toDevanagari('kh')).not.toBe(toDevanagari('k'));
    expect(toDevanagari('ṭhāna')).toBe('ठान');
  });

  it('leaves no Latin letters in any word of the catalog', () => {
    for (const word of catalog.words.values()) {
      expect(toDevanagari(word.pali), word.pali).not.toMatch(/[a-zA-ZÀ-ɏḀ-ỿ]/);
    }
  });
});

describe('pickVoice', () => {
  it('prefers Sanskrit, then Hindi, over other Indic voices', () => {
    expect(pickVoice([voice('ne-NP'), voice('hi-IN'), voice('sa-IN')])?.lang).toBe('sa-IN');
    expect(pickVoice([voice('mr-IN'), voice('hi_IN')])?.lang).toBe('hi_IN');
  });

  it('prefers an on-device voice within a language', () => {
    expect(pickVoice([voice('hi-IN', false), voice('hi-IN', true)])?.localService).toBe(true);
  });

  it('returns null rather than an English voice', () => {
    expect(pickVoice([voice('en-US'), voice('en-IN')])).toBeNull();
    expect(pickVoice([])).toBeNull();
  });
});

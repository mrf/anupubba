import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog } from '../data/catalog.ts';
import { FakeUtterance, installSpeech, spokenTexts } from '../test/fakeSpeech.ts';
import { onVoicesChanged, pickVoice, speakPali, toDevanagari } from './speech.ts';

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

describe('speakPali', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('speaks straight away when nothing is playing, with a BCP 47 language tag', () => {
    const engine = installSpeech(['hi_IN']);
    speakPali('dukkha');
    expect(engine.cancel).not.toHaveBeenCalled();
    const spoken = engine.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(spoken.text).toBe('दुक्ख');
    expect(spoken.lang).toBe('hi-IN');
  });

  it('cuts off the previous word, then speaks after a beat so Chrome does not drop it', () => {
    vi.useFakeTimers();
    const engine = installSpeech(['hi-IN']);
    engine.speaking = true;
    speakPali('mettā');
    expect(engine.cancel).toHaveBeenCalledTimes(1);
    expect(engine.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spokenTexts(engine)).toEqual(['मेत्ता']);
  });

  it('only the last of several quick taps is spoken', () => {
    vi.useFakeTimers();
    const engine = installSpeech(['hi-IN']);
    engine.speaking = true;
    speakPali('mettā');
    speakPali('karuṇā');
    vi.advanceTimersByTime(100);
    expect(spokenTexts(engine)).toEqual(['करुणा']);
  });

  it('resumes an engine left paused', () => {
    const engine = installSpeech(['hi-IN']);
    engine.paused = true;
    speakPali('pīti');
    expect(engine.resume).toHaveBeenCalled();
    expect(engine.speak).toHaveBeenCalledTimes(1);
  });
});

describe('onVoicesChanged', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('falls back to onvoiceschanged where speechSynthesis is no EventTarget', () => {
    const engine = installSpeech(['hi-IN'], { events: false });
    const listener = vi.fn();
    const stop = onVoicesChanged(listener);
    engine.onvoiceschanged?.();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    expect(engine.onvoiceschanged).toBeNull();
  });
});

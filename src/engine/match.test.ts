import { describe, expect, it } from 'vitest';
import { foldPali, matchesPali, matchesPaliLoosely } from './match.ts';

describe('foldPali', () => {
  it('strips diacritics down to ascii', () => {
    expect(foldPali('saṅkhāra')).toBe('sankhara');
    expect(foldPali('paññā')).toBe('panna');
    expect(foldPali('taṇhā')).toBe('tanha');
    expect(foldPali('mettā')).toBe('metta');
    expect(foldPali('upekkhā')).toBe('upekkha');
    expect(foldPali('viññāṇa')).toBe('vinnana');
  });

  it('lowercases and trims', () => {
    expect(foldPali('  Sati ')).toBe('sati');
    expect(foldPali('SAMĀDHI')).toBe('samadhi');
  });

  it('folds the anusvara variants ṃ and ṁ to m', () => {
    expect(foldPali('saṃsāra')).toBe('samsara');
    expect(foldPali('saṁsāra')).toBe('samsara');
  });
});

describe('matchesPali', () => {
  it('accepts ascii input for a diacritic target (§3.2 recall is ascii-forgiving)', () => {
    expect(matchesPali('sankhara', 'saṅkhāra')).toBe(true);
    expect(matchesPali('panna', 'paññā')).toBe(true);
    expect(matchesPali('METTA', 'mettā')).toBe(true);
    expect(matchesPali(' samadhi ', 'samādhi')).toBe(true);
  });

  it('accepts exact diacritic input too', () => {
    expect(matchesPali('saṅkhāra', 'saṅkhāra')).toBe(true);
  });

  it('rejects wrong words', () => {
    expect(matchesPali('sata', 'sati')).toBe(false);
    expect(matchesPali('dukkha', 'sukha')).toBe(false);
    expect(matchesPali('', 'sati')).toBe(false);
  });
});

describe('matchesPaliLoosely', () => {
  it('forgives dropped consonant doubling', () => {
    expect(matchesPaliLoosely('meta', 'mettā')).toBe(true);
    expect(matchesPaliLoosely('upekha', 'upekkhā')).toBe(true);
    expect(matchesPaliLoosely('anica', 'anicca')).toBe(true);
    expect(matchesPaliLoosely('vinana', 'viññāṇa')).toBe(true);
  });

  it('forgives missing aspiration', () => {
    expect(matchesPaliLoosely('dukka', 'dukkha')).toBe(true);
    expect(matchesPaliLoosely('samadi', 'samādhi')).toBe(true);
    expect(matchesPaliLoosely('bavana', 'bhāvanā')).toBe(true);
    expect(matchesPaliLoosely('duka', 'dukkha')).toBe(true);
  });

  it('forgives writing the nasals the way they sound', () => {
    // ṃ heard as n
    expect(matchesPaliLoosely('sansara', 'saṃsāra')).toBe(true);
    // ñ heard as n-y (the app itself teaches paññā as PUN-yaa)
    expect(matchesPaliLoosely('panya', 'paññā')).toBe(true);
    expect(matchesPaliLoosely('sanya', 'saññā')).toBe(true);
  });

  it('forgives velthuis-style doubled vowels for macrons', () => {
    expect(matchesPaliLoosely('sankhaara', 'saṅkhāra')).toBe(true);
    expect(matchesPaliLoosely('mettaa', 'mettā')).toBe(true);
  });

  it('still rejects different words — vowel identity is load-bearing', () => {
    expect(matchesPaliLoosely('sata', 'sati')).toBe(false);
    expect(matchesPaliLoosely('dukkha', 'sukha')).toBe(false);
    expect(matchesPaliLoosely('bhava', 'bhāvanā')).toBe(false);
    expect(matchesPaliLoosely('', 'sati')).toBe(false);
  });

  it('is a wider net than the strict fold', () => {
    expect(matchesPali('meta', 'mettā')).toBe(false);
    expect(matchesPali('panya', 'paññā')).toBe(false);
  });
});

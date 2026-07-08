import { describe, expect, it } from 'vitest';
import { foldPali, matchesPali } from './match.ts';

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

import { describe, expect, it } from 'vitest';
import { recallMatch } from '../engine/match.ts';
import { catalog } from './catalog.ts';
import { SANSKRIT_ALIASES } from './sanskrit.ts';

/** Grade `input` against the shipped word `id`, aliases included. */
function grade(input: string, id: string) {
  const word = catalog.words.get(id);
  if (word === undefined) throw new Error(`no such word "${id}"`);
  return recallMatch(input, word);
}

describe('Sanskrit aliases on recall', () => {
  it('accepts the IAST Sanskrit form of a Pali term', () => {
    expect(grade('smṛti', 'sati')).toBe('exact');
    expect(grade('prajñā', 'panna')).toBe('exact');
    expect(grade('maitrī', 'metta')).toBe('exact');
    expect(grade('vitarka', 'vitakka')).toBe('exact');
    expect(grade('nirvāṇa', 'nibbana')).toBe('exact');
    expect(grade('dharma', 'dhamma')).toBe('exact');
    expect(grade('saṃskāra', 'sankhara')).toBe('exact');
    expect(grade('vijñāna', 'vinnana')).toBe('exact');
    expect(grade('tṛṣṇā', 'tanha')).toBe('exact');
    expect(grade('duḥkha', 'dukkha')).toBe('exact');
    expect(grade('anātman', 'anatta')).toBe('exact');
    expect(grade('sparśa', 'phassa')).toBe('exact');
  });

  it('accepts diacritic-free and popular romanisations of the Sanskrit', () => {
    expect(grade('smrti', 'sati')).toBe('exact');
    expect(grade('smriti', 'sati')).toBe('exact');
    expect(grade('prajna', 'panna')).toBe('exact');
    expect(grade('pragya', 'panna')).toBe('exact');
    expect(grade('prajnya', 'panna')).not.toBe('none');
    expect(grade('maitri', 'metta')).toBe('exact');
    expect(grade('shila', 'sila')).toBe('exact');
    expect(grade('shamatha', 'samatha')).toBe('exact');
    expect(grade('vipashyana', 'vipassana')).toBe('exact');
    expect(grade('samskara', 'sankhara')).toBe('exact');
    expect(grade('sanskara', 'sankhara')).toBe('exact');
    expect(grade('vigyana', 'vinnana')).toBe('exact');
    expect(grade('trishna', 'tanha')).toBe('exact');
    expect(grade('nirvana', 'nibbana')).toBe('exact');
    expect(grade('anitya', 'anicca')).toBe('exact');
    expect(grade('avidya', 'avijja')).toBe('exact');
    expect(grade('upeksha', 'upekkha')).toBe('exact');
    expect(grade('marga', 'magga')).toBe('exact');
    expect(grade('vyapada', 'byapada')).toBe('exact');
    expect(grade('vicikitsa', 'vicikiccha')).toBe('exact');
  });

  it('runs the sound-forgiving fold over aliases too', () => {
    // dropped aspiration / doubling on a Sanskrit form still counts as close
    expect(grade('nirvan', 'nibbana')).toBe('none');
    expect(grade('darma', 'dhamma')).toBe('close');
    expect(grade('praśrabdi', 'passaddhi')).toBe('close');
    expect(grade('SMRITI ', 'sati')).toBe('exact');
  });

  it('does not let aliases make unrelated terms match', () => {
    expect(grade('smriti', 'samadhi')).toBe('none');
    expect(grade('prajna', 'sanna')).toBe('none');
    expect(grade('vitarka', 'vicara')).toBe('none');
    expect(grade('dharma', 'dhammavicaya')).toBe('none');
    expect(grade('maitri', 'mudita')).toBe('none');
    expect(grade('samskara', 'sanna')).toBe('none');
    expect(grade('vijnana', 'sanna')).toBe('none');
    expect(grade('marga', 'dukkha')).toBe('none');
    expect(grade('sukha', 'dukkha')).toBe('none');
    // a Pali term keeps rejecting its Pali near-misses
    expect(grade('sata', 'sati')).toBe('none');
  });

  it('only aliases words that ship', () => {
    for (const id of Object.keys(SANSKRIT_ALIASES)) {
      expect(catalog.words.has(id), id).toBe(true);
    }
  });

  it('never aliases a word with its own Pali spelling', () => {
    for (const [id, aliases] of Object.entries(SANSKRIT_ALIASES)) {
      const word = catalog.words.get(id);
      expect(aliases.length, id).toBeGreaterThan(0);
      for (const alias of aliases) {
        expect(alias, id).not.toBe(word?.pali);
      }
    }
  });
});

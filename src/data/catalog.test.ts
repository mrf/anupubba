import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.ts';

describe('shipped deck content', () => {
  it('loads and cross-validates', () => {
    expect(catalog.decks.length).toBe(8);
    expect(catalog.words.size).toBeGreaterThanOrEqual(30);
  });

  it('orders decks along the gradual path', () => {
    expect(catalog.decks.map((d) => d.id)).toEqual([
      'three-refuges',
      'three-marks',
      'dana-sila-bhavana',
      'four-noble-truths',
      'brahmaviharas',
      'five-khandhas',
      'foundations-of-practice',
      'jhana-factors',
    ]);
  });

  it("authors the design doc's flagship confusable pairs", () => {
    expect(catalog.words.get('piti')?.confusables).toContain('sukha');
    expect(catalog.words.get('sanna')?.confusables).toContain('vinnana');
    expect(catalog.words.get('samatha')?.confusables).toContain('samadhi');
    expect(catalog.words.get('karuna')?.confusables).toContain('mudita');
    expect(catalog.words.get('sati')?.confusables).toContain('sampajanna');
  });

  it('gives every word an etymology, pronunciation, and sutta-or-dictionary source', () => {
    for (const word of catalog.words.values()) {
      expect(word.etymology, word.id).toBeDefined();
      expect(word.pronunciation.length, word.id).toBeGreaterThan(0);
      expect(word.sources.some((s) => s.type === 'dictionary'), word.id).toBe(true);
    }
  });

  it('has a familiarity sort of ~20 terms', () => {
    expect(catalog.familiarity.length).toBe(20);
    expect(new Set(catalog.familiarity).size).toBe(20);
  });

  it('every deck recommends a sutta with a SuttaCentral link', () => {
    for (const deck of catalog.decks) {
      expect(deck.suttaRec.url, deck.id).toMatch(/^https:\/\/suttacentral\.net\//);
      expect(deck.suttaRec.minutes, deck.id).toBeGreaterThan(0);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog.ts';
import { pickDistractors } from './distractors.ts';

/** Deterministic little LCG so shuffles are reproducible in tests. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function piti() {
  const word = catalog.words.get('piti');
  if (word === undefined) throw new Error('piti missing from catalog');
  return word;
}

describe('pickDistractors — the distractor dial (§3.3)', () => {
  it('gives new words semantically distant distractors: no confusables, no cluster-mates', () => {
    const picks = pickDistractors(piti(), catalog, 0, 3, seededRng(7));
    expect(picks).toHaveLength(3);
    for (const pick of picks) {
      expect(pick.id).not.toBe('piti');
      expect(pick.cluster).not.toBe('jhana-factors');
      expect(piti().confusables).not.toContain(pick.id);
    }
  });

  it('gives maturing words their cluster-mates', () => {
    const picks = pickDistractors(piti(), catalog, 0.5, 3, seededRng(7));
    expect(picks.some((p) => p.cluster === 'jhana-factors')).toBe(true);
  });

  it('gives mature words their true confusables — pīti finally meets sukha', () => {
    const picks = pickDistractors(piti(), catalog, 1, 3, seededRng(7));
    expect(picks.map((p) => p.id)).toContain('sukha');
  });

  it('never duplicates and never includes the word itself', () => {
    for (const dial of [0, 0.5, 1]) {
      const picks = pickDistractors(piti(), catalog, dial, 3, seededRng(11));
      const ids = picks.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain('piti');
    }
  });

  it('is deterministic for a fixed rng', () => {
    const a = pickDistractors(piti(), catalog, 1, 3, seededRng(42));
    const b = pickDistractors(piti(), catalog, 1, 3, seededRng(42));
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
  });
});

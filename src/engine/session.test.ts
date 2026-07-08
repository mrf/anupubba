import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog.ts';
import { planSession, recommendSutta, toSnapshots } from './session.ts';
import type { WordSnapshot } from './session.ts';
import { newWordState, reviewWord, seedFromFamiliarity } from './srs.ts';

const NOW = new Date('2026-07-08T12:00:00Z');
const OPTS = { minutes: 5, maxNew: 3 };

function blankSnapshots(): WordSnapshot[] {
  return toSnapshots(catalog, new Map());
}

describe('planSession', () => {
  it('introduces the first deck to a brand-new user: intro then drill, per word', () => {
    const plan = planSession(blankSnapshots(), catalog, OPTS, NOW);
    const kinds = plan.items.map((i) => i.kind);
    expect(kinds[0]).toBe('intro');
    // No fail-to-learn (§4.3): a drill for a word only after its intro card.
    const introduced = new Set<string>();
    for (const item of plan.items) {
      if (item.kind === 'intro') introduced.add(item.wordId);
      if (item.kind === 'recognition') expect(introduced.has(item.wordId)).toBe(true);
    }
    // maxNew respected.
    expect(plan.items.filter((i) => i.kind === 'intro').length).toBeLessThanOrEqual(OPTS.maxNew);
  });

  it('ends the first session with the talk paragraph once the whole deck is introduced (§4.4)', () => {
    const plan = planSession(blankSnapshots(), catalog, OPTS, NOW);
    const last = plan.items.at(-1);
    expect(last).toEqual({ kind: 'talk', deckId: 'three-refuges' });
  });

  it('puts due reviews ahead of new material', () => {
    const snapshots = blankSnapshots().map((s) => {
      if (s.id !== 'metta') return s;
      const overdue = reviewWord(newWordState(new Date('2026-06-01T12:00:00Z')), 'familiar', new Date('2026-06-01T12:00:00Z'));
      return { ...s, card: overdue };
    });
    const plan = planSession(snapshots, catalog, OPTS, NOW);
    const first = plan.items[0];
    expect(first?.kind).not.toBe('intro');
    expect(first !== undefined && 'wordId' in first && first.wordId).toBe('metta');
  });

  it('drills due words at their mastery stage', () => {
    const seeded = seedFromFamiliarity('heard', new Date('2026-06-01T12:00:00Z'));
    if (seeded === null) throw new Error('unreachable');
    const snapshots = blankSnapshots().map((s) =>
      s.id === 'sati' ? { ...s, card: seeded, mastery: { stage: 'recall' as const, streak: 0 } } : s,
    );
    const plan = planSession(snapshots, catalog, OPTS, NOW);
    expect(plan.items.some((i) => i.kind === 'recall' && i.wordId === 'sati')).toBe(true);
  });

  it('bounds the session (§5): drill items never exceed the minute budget', () => {
    const past = new Date('2026-06-01T12:00:00Z');
    const snapshots = blankSnapshots().map((s) => ({
      ...s,
      card: reviewWord(newWordState(past), 'familiar', past),
    }));
    const plan = planSession(snapshots, catalog, { minutes: 2, maxNew: 3 }, NOW);
    const drills = plan.items.filter((i) => i.kind !== 'talk');
    expect(drills.length).toBeLessThanOrEqual(2 * 3);
  });
});

describe('recommendSutta', () => {
  it('recommends from the deck most worked this session', () => {
    const plan = planSession(blankSnapshots(), catalog, OPTS, NOW);
    const rec = recommendSutta(plan, catalog);
    expect(rec.ref).toBe('kp1');
  });
});

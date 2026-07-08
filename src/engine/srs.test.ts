import { Rating, State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import {
  gradeToRating,
  isDue,
  maturity,
  newWordState,
  reviewWord,
  seedFromFamiliarity,
} from './srs.ts';

const NOW = new Date('2026-07-08T12:00:00Z');

describe('gradeToRating', () => {
  it('maps the non-aversive grades onto FSRS ratings', () => {
    expect(gradeToRating('notYet')).toBe(Rating.Again);
    expect(gradeToRating('familiar')).toBe(Rating.Good);
    expect(gradeToRating('clear')).toBe(Rating.Easy);
  });
});

describe('reviewWord', () => {
  it('moves a new card out of the New state and schedules it forward', () => {
    const next = reviewWord(newWordState(NOW), 'familiar', NOW);
    expect(next.state).not.toBe(State.New);
    expect(next.due.getTime()).toBeGreaterThan(NOW.getTime());
    expect(next.reps).toBe(1);
  });

  it('schedules clear further out than notYet', () => {
    const base = newWordState(NOW);
    const clear = reviewWord(base, 'clear', NOW);
    const notYet = reviewWord(base, 'notYet', NOW);
    expect(clear.due.getTime()).toBeGreaterThan(notYet.due.getTime());
  });
});

describe('seedFromFamiliarity', () => {
  it('gives "know it" more stability than "heard it"', () => {
    const know = seedFromFamiliarity('know', NOW);
    const heard = seedFromFamiliarity('heard', NOW);
    expect(know).not.toBeNull();
    expect(heard).not.toBeNull();
    if (know === null || heard === null) throw new Error('unreachable');
    expect(know.stability).toBeGreaterThan(heard.stability);
    // Known words should not flood day one with reviews.
    expect(know.due.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('leaves "new to me" untouched — no card until the introduction lesson', () => {
    expect(seedFromFamiliarity('new', NOW)).toBeNull();
  });
});

describe('isDue / maturity', () => {
  it('treats past-due cards as due', () => {
    const card = reviewWord(newWordState(NOW), 'familiar', NOW);
    expect(isDue(card, NOW)).toBe(false);
    expect(isDue(card, new Date(card.due.getTime() + 1))).toBe(true);
  });

  it('rates unseen cards immature and seeded-known cards more mature', () => {
    expect(maturity(null)).toBe(0);
    expect(maturity(newWordState(NOW))).toBe(0);
    const know = seedFromFamiliarity('know', NOW);
    if (know === null) throw new Error('unreachable');
    expect(maturity(know)).toBeGreaterThan(0.2);
  });
});

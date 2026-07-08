import { describe, expect, it } from 'vitest';
import { advanceMastery, drillFor, initialMastery } from './mastery.ts';
import type { Mastery } from './mastery.ts';

describe('initialMastery', () => {
  it('starts at recognition by default', () => {
    expect(initialMastery()).toEqual({ stage: 'recognition', streak: 0 });
  });

  it('lets already-known words skip straight to recall', () => {
    expect(initialMastery('know').stage).toBe('recall');
    expect(initialMastery('heard').stage).toBe('recognition');
    expect(initialMastery('new').stage).toBe('recognition');
  });
});

describe('advanceMastery', () => {
  it('promotes after two consecutive successful reps', () => {
    let m: Mastery = { stage: 'recognition', streak: 0 };
    m = advanceMastery(m, 'familiar');
    expect(m).toEqual({ stage: 'recognition', streak: 1 });
    m = advanceMastery(m, 'clear');
    expect(m).toEqual({ stage: 'recall', streak: 0 });
  });

  it('climbs the full ladder: recognition → recall → discrimination → comprehension', () => {
    let m: Mastery = { stage: 'recognition', streak: 0 };
    for (let i = 0; i < 6; i++) m = advanceMastery(m, 'clear');
    expect(m.stage).toBe('comprehension');
  });

  it('stays at comprehension on further success', () => {
    const m = advanceMastery({ stage: 'comprehension', streak: 1 }, 'clear');
    expect(m.stage).toBe('comprehension');
  });

  it('resets the streak on notYet at the early stages without demoting', () => {
    expect(advanceMastery({ stage: 'recognition', streak: 1 }, 'notYet')).toEqual({
      stage: 'recognition',
      streak: 0,
    });
    expect(advanceMastery({ stage: 'recall', streak: 1 }, 'notYet')).toEqual({
      stage: 'recall',
      streak: 0,
    });
  });

  it('drops one stage on notYet at discrimination or comprehension', () => {
    expect(advanceMastery({ stage: 'discrimination', streak: 1 }, 'notYet').stage).toBe('recall');
    // Tapping a gloss in talk mode logs notYet — the word returns for drilling.
    expect(advanceMastery({ stage: 'comprehension', streak: 0 }, 'notYet').stage).toBe(
      'discrimination',
    );
  });
});

describe('drillFor', () => {
  it('maps stages to drill kinds', () => {
    expect(drillFor('recognition')).toBe('recognition');
    expect(drillFor('recall')).toBe('recall');
    expect(drillFor('discrimination')).toBe('discrimination');
    expect(drillFor('comprehension')).toBe('discrimination');
  });
});

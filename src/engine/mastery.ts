import type { FamiliarityLevel, SessionGrade } from './srs.ts';

/** The per-word mastery ladder (§3.2). */
export type MasteryStage = 'recognition' | 'recall' | 'discrimination' | 'comprehension';

export interface Mastery {
  stage: MasteryStage;
  /** Consecutive successful reps at the current stage. */
  streak: number;
}

export type DrillKind = 'recognition' | 'recall' | 'discrimination';

const LADDER: readonly MasteryStage[] = [
  'recognition',
  'recall',
  'discrimination',
  'comprehension',
];

const PROMOTE_AT = 2;

export function initialMastery(level?: FamiliarityLevel): Mastery {
  return { stage: level === 'know' ? 'recall' : 'recognition', streak: 0 };
}

export function advanceMastery(mastery: Mastery, grade: SessionGrade): Mastery {
  const rung = LADDER.indexOf(mastery.stage);
  if (grade === 'notYet') {
    // Early stages just reset the streak; the upper stages hand the word
    // back for re-drilling (a talk-mode gloss tap lands here, §3.4).
    const demoted = mastery.stage === 'discrimination' || mastery.stage === 'comprehension';
    const stage = demoted ? (LADDER[rung - 1] ?? 'recognition') : mastery.stage;
    return { stage, streak: 0 };
  }
  const streak = mastery.streak + 1;
  if (streak >= PROMOTE_AT && mastery.stage !== 'comprehension') {
    return { stage: LADDER[rung + 1] ?? 'comprehension', streak: 0 };
  }
  return { stage: mastery.stage, streak };
}

/** Which drill exercises a word at a given stage; comprehension words are kept sharp with confusable drills between talk readings. */
export function drillFor(stage: MasteryStage): DrillKind {
  switch (stage) {
    case 'recognition':
      return 'recognition';
    case 'recall':
      return 'recall';
    case 'discrimination':
    case 'comprehension':
      return 'discrimination';
  }
}

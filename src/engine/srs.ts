import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';

/** Non-aversive grading language (§2): no "wrong", only not-yet-clear. */
export type SessionGrade = 'notYet' | 'familiar' | 'clear';

/** The familiarity sort's three buttons (§4.2). */
export type FamiliarityLevel = 'know' | 'heard' | 'new';

const scheduler = fsrs();

const DAY_MS = 24 * 60 * 60 * 1000;

export function gradeToRating(grade: SessionGrade): Grade {
  switch (grade) {
    case 'notYet':
      return Rating.Again;
    case 'familiar':
      return Rating.Good;
    case 'clear':
      return Rating.Easy;
  }
}

export function newWordState(now: Date): Card {
  return createEmptyCard(now);
}

export function reviewWord(card: Card, grade: SessionGrade, now: Date): Card {
  return scheduler.next(card, now, gradeToRating(grade)).card;
}

/**
 * Seed SRS state from the familiarity sort (§4.2): passive exposure is real
 * prior contact, modeled as backdated successful reviews. "New to me" words
 * stay untouched until their introduction card (§4.3 — no fail-to-learn).
 */
export function seedFromFamiliarity(level: FamiliarityLevel, now: Date): Card | null {
  if (level === 'new') return null;
  const reviewDays = level === 'know' ? [-30, -20, -8] : [-2];
  let card = createEmptyCard(new Date(now.getTime() + (reviewDays[0] ?? 0) * DAY_MS));
  for (const days of reviewDays) {
    card = scheduler.next(card, new Date(now.getTime() + days * DAY_MS), Rating.Good).card;
  }
  return card;
}

export function isDue(card: Card, now: Date): boolean {
  return card.due.getTime() <= now.getTime();
}

/**
 * 0..1 maturity for the distractor dial (§3.3). Stability is FSRS's own
 * memory-strength estimate in days; ~3 weeks of stability counts as mature.
 */
const MATURE_STABILITY_DAYS = 21;

export function maturity(card: Card | null): number {
  if (card === null || card.state === State.New) return 0;
  return Math.min(1, card.stability / MATURE_STABILITY_DAYS);
}

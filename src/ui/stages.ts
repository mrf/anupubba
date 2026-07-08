import type { MasteryStage } from '../engine/mastery.ts';

/**
 * Growth metaphor for the mastery ladder (§2 — bhāvanā literally means
 * cultivation), in ladder order. The full bodhi-tree visualization is
 * Phase 3; these labels are its seed.
 */
export const STAGE_GROWTH: readonly (readonly [MasteryStage, string])[] = [
  ['recognition', 'seed'],
  ['recall', 'sprout'],
  ['discrimination', 'bud'],
  ['comprehension', 'bloom'],
];

export const UNTOUCHED_LABEL = 'not yet met';

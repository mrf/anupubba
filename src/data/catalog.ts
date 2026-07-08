import type { Catalog } from './types.ts';
import { buildCatalog } from './validate.ts';
import brahmaviharas from './decks/brahmaviharas.json';
import danaSilaBhavana from './decks/dana-sila-bhavana.json';
import fiveKhandhas from './decks/five-khandhas.json';
import foundationsOfPractice from './decks/foundations-of-practice.json';
import fourNobleTruths from './decks/four-noble-truths.json';
import jhanaFactors from './decks/jhana-factors.json';
import threeMarks from './decks/three-marks.json';
import threeRefuges from './decks/three-refuges.json';

/**
 * The ~20 high-frequency terms shown in the familiarity sort (§4.2).
 * Hand-curated for now; to be replaced by the empirical talk-transcript
 * frequency ranking (§6.3) when that corpus work lands.
 */
const FAMILIARITY_IDS: readonly string[] = [
  'buddha',
  'dhamma',
  'sangha',
  'anicca',
  'dukkha',
  'anatta',
  'dana',
  'sila',
  'bhavana',
  'tanha',
  'nibbana',
  'metta',
  'karuna',
  'mudita',
  'upekkha',
  'sati',
  'samadhi',
  'vipassana',
  'panna',
  'sukha',
];

/** Validated once at module load; a content error fails fast and loudly. */
export const catalog: Catalog = buildCatalog(
  [
    threeRefuges,
    threeMarks,
    danaSilaBhavana,
    fourNobleTruths,
    brahmaviharas,
    fiveKhandhas,
    foundationsOfPractice,
    jhanaFactors,
  ],
  FAMILIARITY_IDS,
);

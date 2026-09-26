import type { Catalog } from './types.ts';
import { buildCatalog } from './validate.ts';
import bojjhangas from './decks/bojjhangas.json';
import brahmaviharas from './decks/brahmaviharas.json';
import cetasikasBeautifulCommon from './decks/cetasikas-beautiful-common.json';
import cetasikasBeautifulSpecial from './decks/cetasikas-beautiful-special.json';
import cetasikasOccasionals from './decks/cetasikas-occasionals.json';
import cetasikasSixPairs from './decks/cetasikas-six-pairs.json';
import cetasikasUniversals from './decks/cetasikas-universals.json';
import cetasikasUnwholesome from './decks/cetasikas-unwholesome.json';
import danaSilaBhavana from './decks/dana-sila-bhavana.json';
import fiveHindrances from './decks/five-hindrances.json';
import fiveKhandhas from './decks/five-khandhas.json';
import foundationsOfPractice from './decks/foundations-of-practice.json';
import fourNobleTruths from './decks/four-noble-truths.json';
import jhanaFactors from './decks/jhana-factors.json';
import paticcaSamuppada from './decks/paticca-samuppada.json';
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
    // Array position is cosmetic — each deck's `order` field governs; buildCatalog sorts.
    threeRefuges,
    threeMarks,
    danaSilaBhavana,
    fourNobleTruths,
    brahmaviharas,
    fiveKhandhas,
    foundationsOfPractice,
    jhanaFactors,
    fiveHindrances,
    bojjhangas,
    paticcaSamuppada,
    // Advanced tier: the 52 cetasikas (DESIGN.md §6.1), one deck per chart group.
    cetasikasUniversals,
    cetasikasOccasionals,
    cetasikasUnwholesome,
    cetasikasBeautifulCommon,
    cetasikasSixPairs,
    cetasikasBeautifulSpecial,
  ],
  FAMILIARITY_IDS,
);

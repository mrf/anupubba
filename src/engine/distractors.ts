import type { Catalog, WordCard } from '../data/types.ts';

export type Rng = () => number;

export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

/**
 * The distractor dial (§3.3): distractor difficulty scales with maturity.
 * New words get semantically distant options; maturing words meet their
 * cluster-mates; mature words face their authored confusables.
 */
export function pickDistractors(
  word: WordCard,
  catalog: Catalog,
  dial: number,
  count: number,
  rng: Rng,
): WordCard[] {
  const all = [...catalog.words.values()].filter((w) => w.id !== word.id);
  const confusables = word.confusables
    .map((id) => catalog.words.get(id))
    .filter((w): w is WordCard => w !== undefined);
  const clusterMates = all.filter(
    (w) => w.cluster === word.cluster && !word.confusables.includes(w.id),
  );
  const distant = all.filter(
    (w) => w.cluster !== word.cluster && !word.confusables.includes(w.id),
  );

  // Preference order per dial tier; later pools fill any shortfall.
  let pools: readonly (readonly WordCard[])[];
  if (dial < 1 / 3) {
    pools = [distant, clusterMates, confusables];
  } else if (dial < 2 / 3) {
    pools = [clusterMates, distant, confusables];
  } else {
    pools = [confusables, clusterMates, distant];
  }

  const picks: WordCard[] = [];
  const seen = new Set<string>();
  for (const pool of pools) {
    for (const candidate of shuffled(pool, rng)) {
      if (picks.length >= count) return picks;
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      picks.push(candidate);
    }
  }
  return picks;
}

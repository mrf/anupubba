import type { SuttaRec } from '../data/types.ts';

export interface DeckGrowth {
  name: string;
  /** Counts by growth stage, in display order: seed, sprout, bud, bloom. */
  counts: readonly (readonly [string, number])[];
}

/**
 * The closing screen (§5): cultivation count, quiet growth, and one sutta —
 * the app points beyond itself. Reading is the treat.
 */
export function Closing(props: {
  reps: number;
  cultivationCount: number;
  growth: readonly DeckGrowth[];
  rec: SuttaRec;
  onClose: () => void;
}) {
  const { reps, cultivationCount, growth, rec, onClose } = props;
  return (
    <main class="screen">
      <header class="screen-head">
        <h1>enough for today</h1>
        <p>
          {reps} moments of cultivation this sit · {cultivationCount} lifetime
        </p>
      </header>

      <section class="card growth">
        {growth.map((deck) => (
          <p key={deck.name}>
            <strong>{deck.name}</strong> —{' '}
            {deck.counts
              .filter(([, count]) => count > 0)
              .map(([stage, count]) => `${String(count)} ${stage}`)
              .join(' · ')}
          </p>
        ))}
      </section>

      <section class="card rec">
        <p class="rec-lead">if you'd like to keep going, put the app down and read:</p>
        <a class="rec-title" href={rec.url} target="_blank" rel="noopener noreferrer">
          {rec.title}
        </a>
        <p class="rec-blurb">
          {rec.blurb} (~{String(rec.minutes)} min)
        </p>
      </section>

      <button class="btn primary" onClick={onClose}>
        close
      </button>
    </main>
  );
}

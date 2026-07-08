import type { Catalog } from '../data/types.ts';
import type { Meta, Settings, WordState } from '../engine/store.ts';

const STAGE_LABELS = {
  untouched: 'not yet met',
  recognition: 'seed',
  recall: 'sprout',
  discrimination: 'bud',
  comprehension: 'bloom',
} as const;

type StageKey = keyof typeof STAGE_LABELS;

function stageOf(state: WordState | undefined): StageKey {
  return state === undefined ? 'untouched' : state.mastery.stage;
}

export function Home(props: {
  catalog: Catalog;
  meta: Meta;
  words: ReadonlyMap<string, WordState>;
  notice: string | null;
  onStart: () => void;
  onSounds: () => void;
  onSettings: (settings: Settings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const { catalog, meta, words, notice, onStart, onSounds, onSettings, onExport, onImport } =
    props;
  return (
    <main class="screen">
      <header class="screen-head">
        <h1>anupubba</h1>
        <p class="tagline">gradual, step-by-step, in due order</p>
      </header>

      {notice !== null && <p class="notice">{notice}</p>}

      <button class="btn primary big" onClick={onStart}>
        begin a sit · ~{meta.settings.minutes} min
      </button>

      <section class="clusters">
        {catalog.decks.map((deck) => (
          <div key={deck.id} class="cluster-row">
            <div class="cluster-names">
              <span class="cluster-name">{deck.name}</span>
              <span class="cluster-pali" lang="pi">
                {deck.paliName}
              </span>
            </div>
            <div class="cluster-dots">
              {deck.words.map((word) => {
                const stage = stageOf(words.get(word.id));
                return (
                  <span
                    key={word.id}
                    class={`dot ${stage}`}
                    title={`${word.pali} — ${STAGE_LABELS[stage]}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <p class="legend">
          <span class="dot untouched" /> not yet met · <span class="dot recognition" /> seed ·{' '}
          <span class="dot recall" /> sprout · <span class="dot discrimination" /> bud ·{' '}
          <span class="dot comprehension" /> bloom
        </p>
      </section>

      <p class="cultivation">
        {meta.cultivationCount} moments of cultivation, lifetime — this number only grows
      </p>

      <section class="settings">
        <label>
          session length{' '}
          <select
            value={meta.settings.minutes}
            onChange={(event) => {
              onSettings({
                ...meta.settings,
                minutes: Number((event.target as HTMLSelectElement).value),
              });
            }}
          >
            <option value="5">5 min</option>
            <option value="7">7 min</option>
            <option value="10">10 min</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={meta.settings.bell}
            onChange={(event) => {
              onSettings({ ...meta.settings, bell: (event.target as HTMLInputElement).checked });
            }}
          />{' '}
          bells
        </label>
      </section>

      <footer class="home-foot">
        <button class="btn quiet" onClick={onSounds}>
          the sounds
        </button>
        <button class="btn quiet" onClick={onExport}>
          export
        </button>
        <label class="btn quiet file-label">
          import
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (file !== undefined) onImport(file);
              (event.target as HTMLInputElement).value = '';
            }}
          />
        </label>
      </footer>
    </main>
  );
}

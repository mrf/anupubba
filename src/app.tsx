import { useEffect, useRef, useState } from 'preact/hooks';
import { ringBell } from './audio/bell.ts';
import { catalog } from './data/catalog.ts';
import type { SuttaRec } from './data/types.ts';
import { advanceMastery, initialMastery } from './engine/mastery.ts';
import { planSession, recommendSutta, toSnapshots } from './engine/session.ts';
import type { SessionPlan } from './engine/session.ts';
import { maturity, newWordState, reviewWord, seedFromFamiliarity } from './engine/srs.ts';
import type { FamiliarityLevel, SessionGrade } from './engine/srs.ts';
import { DEFAULT_META, openStore } from './engine/store.ts';
import type { Meta, Settings, Store, WordState } from './engine/store.ts';
import { Closing } from './ui/Closing.tsx';
import type { DeckGrowth } from './ui/Closing.tsx';
import { FamiliaritySort } from './ui/FamiliaritySort.tsx';
import { Home } from './ui/Home.tsx';
import { Lesson0 } from './ui/Lesson0.tsx';
import { SessionView } from './ui/SessionView.tsx';
import { STAGE_GROWTH } from './ui/stages.ts';

type Phase =
  | { name: 'loading' }
  | { name: 'familiarity' }
  | { name: 'lesson0' }
  | { name: 'home' }
  | { name: 'session'; plan: SessionPlan }
  | { name: 'closing'; rec: SuttaRec; reps: number; growth: readonly DeckGrowth[] };

export function App() {
  // Refs are the source of truth for mutable app data: session handlers fire
  // many mutations between renders (e.g. talk-mode finish grades several
  // words at once), and stale useState closures would drop updates.
  const storeRef = useRef<Store | null>(null);
  const metaRef = useRef<Meta>(DEFAULT_META);
  const wordsRef = useRef<Map<string, WordState>>(new Map());
  const sessionRepsRef = useRef(0);
  const [phase, setPhase] = useState<Phase>({ name: 'loading' });
  const [notice, setNotice] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const rerender = () => {
    setVersion((v) => v + 1);
  };

  useEffect(() => {
    const status = { cancelled: false };
    void (async () => {
      const store = await openStore();
      const meta = await store.loadMeta();
      const words = await store.loadWordStates();
      if (status.cancelled) {
        store.close();
        return;
      }
      storeRef.current = store;
      metaRef.current = meta;
      wordsRef.current = words;
      setPhase(meta.onboarded ? { name: 'home' } : { name: 'familiarity' });
    })();
    return () => {
      status.cancelled = true;
    };
  }, []);

  function saveMeta(next: Meta) {
    metaRef.current = next;
    const store = storeRef.current;
    if (store !== null) void store.putMeta(next);
    rerender();
  }

  function saveWord(next: WordState) {
    wordsRef.current.set(next.id, next);
    const store = storeRef.current;
    if (store !== null) void store.putWordState(next);
    rerender();
  }

  /** Every graded rep — drill or talk tap — is one moment of cultivation (§2). */
  function applyGrade(wordId: string, grade: SessionGrade) {
    const now = new Date();
    const existing = wordsRef.current.get(wordId);
    const card = reviewWord(existing?.card ?? newWordState(now), grade, now);
    const mastery = advanceMastery(existing?.mastery ?? initialMastery(), grade);
    saveWord({ id: wordId, card, mastery });
    sessionRepsRef.current += 1;
    saveMeta({ ...metaRef.current, cultivationCount: metaRef.current.cultivationCount + 1 });
  }

  function completeFamiliarity(answers: ReadonlyMap<string, FamiliarityLevel>) {
    const now = new Date();
    for (const [id, level] of answers) {
      const card = seedFromFamiliarity(level, now);
      if (card !== null) {
        saveWord({ id, card, mastery: initialMastery(level) });
      }
    }
    saveMeta({ ...metaRef.current, onboarded: true });
    setPhase({ name: 'lesson0' });
  }

  function startSession() {
    setNotice(null);
    const meta = metaRef.current;
    const plan = planSession(toSnapshots(catalog, wordsRef.current), catalog, meta.settings, new Date());
    if (plan.items.length === 0) {
      setNotice('nothing to tend right now — everything is resting. come back later.');
      return;
    }
    sessionRepsRef.current = 0;
    if (meta.settings.bell) ringBell('open');
    setPhase({ name: 'session', plan });
  }

  function completeSession(plan: SessionPlan) {
    const meta = metaRef.current;
    if (meta.settings.bell) ringBell('close');
    const deckIds = new Set(
      plan.items.map((item) =>
        item.kind === 'talk' ? item.deckId : (catalog.deckOf.get(item.wordId)?.id ?? ''),
      ),
    );
    const growth: DeckGrowth[] = catalog.decks
      .filter((deck) => deckIds.has(deck.id))
      .map((deck) => ({
        name: deck.name,
        counts: STAGE_GROWTH.map(([stage, label]) => [
          label,
          deck.words.filter((w) => wordsRef.current.get(w.id)?.mastery.stage === stage).length,
        ]),
      }));
    setPhase({
      name: 'closing',
      rec: recommendSutta(plan, catalog),
      reps: sessionRepsRef.current,
      growth,
    });
  }

  function onTalkFinish(deckId: string, tapped: ReadonlySet<string>) {
    const deck = catalog.deckById.get(deckId);
    if (deck === undefined) return;
    const termIds = new Set(deck.talk.flatMap((s) => (s.kind === 'term' ? [s.term] : [])));
    for (const id of termIds) {
      // Reading through cleanly logs comprehension reps (§3.4); taps were
      // already logged as notYet the moment they happened.
      if (!tapped.has(id) && wordsRef.current.get(id)?.mastery.stage === 'comprehension') {
        applyGrade(id, 'familiar');
      }
    }
  }

  function exportState() {
    const store = storeRef.current;
    if (store === null) return;
    void (async () => {
      const now = new Date();
      const json = await store.exportJson(now);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `anupubba-${now.toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    })();
  }

  function importState(file: File) {
    const store = storeRef.current;
    if (store === null) return;
    void (async () => {
      try {
        await store.importJson(await file.text());
        metaRef.current = await store.loadMeta();
        wordsRef.current = await store.loadWordStates();
        setNotice('import complete — welcome back');
      } catch {
        setNotice('that file could not be read as an anupubba export');
      }
      rerender();
    })();
  }

  switch (phase.name) {
    case 'loading':
      return <main class="screen wordmark">anupubba</main>;
    case 'familiarity':
      return <FamiliaritySort catalog={catalog} onDone={completeFamiliarity} />;
    case 'lesson0':
      return (
        <Lesson0
          onDone={() => {
            saveMeta({ ...metaRef.current, lesson0Done: true });
            setPhase({ name: 'home' });
          }}
          onSkip={() => {
            setPhase({ name: 'home' });
          }}
        />
      );
    case 'home':
      return (
        <Home
          catalog={catalog}
          meta={metaRef.current}
          words={wordsRef.current}
          notice={notice}
          onStart={startSession}
          onSounds={() => {
            setPhase({ name: 'lesson0' });
          }}
          onSettings={(settings: Settings) => {
            saveMeta({ ...metaRef.current, settings });
          }}
          onExport={exportState}
          onImport={importState}
        />
      );
    case 'session':
      return (
        <SessionView
          plan={phase.plan}
          catalog={catalog}
          maturityOf={(wordId) => maturity(wordsRef.current.get(wordId)?.card ?? null)}
          onIntro={(wordId) => {
            if (!wordsRef.current.has(wordId)) {
              saveWord({ id: wordId, card: newWordState(new Date()), mastery: initialMastery() });
            }
          }}
          onGrade={applyGrade}
          onTalkTap={(wordId) => {
            applyGrade(wordId, 'notYet');
          }}
          onTalkFinish={onTalkFinish}
          onComplete={() => {
            completeSession(phase.plan);
          }}
        />
      );
    case 'closing':
      return (
        <Closing
          reps={phase.reps}
          cultivationCount={metaRef.current.cultivationCount}
          growth={phase.growth}
          rec={phase.rec}
          onClose={() => {
            setNotice(null);
            setPhase({ name: 'home' });
          }}
        />
      );
  }
}

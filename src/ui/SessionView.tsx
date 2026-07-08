import { useMemo, useState } from 'preact/hooks';
import type { Catalog } from '../data/types.ts';
import { pickDistractors } from '../engine/distractors.ts';
import type { SessionGrade } from '../engine/srs.ts';
import type { SessionItem, SessionPlan } from '../engine/session.ts';
import { IntroCard, RecallDrill, RecognitionDrill } from './drills.tsx';
import { TalkReader } from './TalkReader.tsx';

const DISTRACTOR_COUNT = 3;

export function SessionView(props: {
  plan: SessionPlan;
  catalog: Catalog;
  maturityOf: (wordId: string) => number;
  onIntro: (wordId: string) => void;
  onGrade: (wordId: string, grade: SessionGrade) => void;
  onTalkTap: (wordId: string) => void;
  onTalkFinish: (deckId: string, tapped: ReadonlySet<string>) => void;
  onComplete: () => void;
}) {
  const { plan, catalog, maturityOf, onIntro, onGrade, onTalkTap, onTalkFinish, onComplete } =
    props;
  const [index, setIndex] = useState(0);
  const item = plan.items[index];

  function advance() {
    if (index + 1 >= plan.items.length) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  }

  if (item === undefined) return null;
  return (
    <main class="screen">
      <p class="session-count">
        {index + 1} · {plan.items.length}
      </p>
      <SessionItemView
        key={index}
        item={item}
        catalog={catalog}
        maturityOf={maturityOf}
        onIntro={onIntro}
        onGrade={onGrade}
        onTalkTap={onTalkTap}
        onTalkFinish={onTalkFinish}
        advance={advance}
      />
    </main>
  );
}

function SessionItemView(props: {
  item: SessionItem;
  catalog: Catalog;
  maturityOf: (wordId: string) => number;
  onIntro: (wordId: string) => void;
  onGrade: (wordId: string, grade: SessionGrade) => void;
  onTalkTap: (wordId: string) => void;
  onTalkFinish: (deckId: string, tapped: ReadonlySet<string>) => void;
  advance: () => void;
}) {
  const { item, catalog, maturityOf, onIntro, onGrade, onTalkTap, onTalkFinish, advance } = props;

  if (item.kind === 'talk') {
    const deck = catalog.decks.find((d) => d.id === item.deckId);
    if (deck === undefined) return null;
    return (
      <TalkReader
        deck={deck}
        catalog={catalog}
        onTap={onTalkTap}
        onFinish={(tapped) => {
          onTalkFinish(deck.id, tapped);
          advance();
        }}
      />
    );
  }

  const word = catalog.words.get(item.wordId);
  if (word === undefined) return null;

  switch (item.kind) {
    case 'intro':
      return (
        <IntroCard
          word={word}
          onDone={() => {
            onIntro(word.id);
            advance();
          }}
        />
      );
    case 'recall':
      return (
        <RecallDrill
          word={word}
          onDone={(grade) => {
            onGrade(word.id, grade);
            advance();
          }}
        />
      );
    case 'recognition':
    case 'discrimination':
      return (
        <RecognitionWithDial
          wordId={word.id}
          dial={item.kind === 'discrimination' ? 1 : maturityOf(word.id)}
          catalog={catalog}
          onDone={(grade) => {
            onGrade(word.id, grade);
            advance();
          }}
        />
      );
  }
}

function RecognitionWithDial(props: {
  wordId: string;
  dial: number;
  catalog: Catalog;
  onDone: (grade: SessionGrade) => void;
}) {
  const { wordId, dial, catalog, onDone } = props;
  const word = catalog.words.get(wordId);
  const distractors = useMemo(
    () => (word === undefined ? [] : pickDistractors(word, catalog, dial, DISTRACTOR_COUNT, Math.random)),
    [word, catalog, dial],
  );
  if (word === undefined) return null;
  return <RecognitionDrill word={word} distractors={distractors} onDone={onDone} />;
}

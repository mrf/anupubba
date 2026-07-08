/** A verifiable source for a claim — ehipassiko, "come and see" (DESIGN.md §7). */
export interface SourceRef {
  type: 'sutta' | 'dictionary';
  ref: string;
  url: string;
}

export interface Etymology {
  root: string;
  note: string;
}

export interface CanonicalLine {
  pali: string;
  translation: string;
  ref: string;
}

export interface WordCard {
  id: string;
  pali: string;
  gloss: string;
  literal?: string;
  etymology?: Etymology;
  cluster: string;
  confusables: string[];
  canonicalLine?: CanonicalLine;
  sources: SourceRef[];
  pronunciation: string;
}

/** Talk-mode paragraphs are prose interleaved with tappable Pali terms (§3.4). */
export type TalkSegment =
  | { kind: 'text'; text: string }
  | { kind: 'term'; term: string; surface: string };

export interface SuttaRec {
  title: string;
  ref: string;
  url: string;
  blurb: string;
  minutes: number;
}

/** One teaching cluster: 3–6 words, a talk paragraph, a sutta to read after (§4.3, §5). */
export interface Deck {
  id: string;
  name: string;
  paliName: string;
  order: number;
  intro: string;
  words: WordCard[];
  talk: TalkSegment[];
  suttaRec: SuttaRec;
}

export interface Catalog {
  decks: readonly Deck[];
  words: ReadonlyMap<string, WordCard>;
  deckById: ReadonlyMap<string, Deck>;
  deckOf: ReadonlyMap<string, Deck>;
  familiarity: readonly string[];
}

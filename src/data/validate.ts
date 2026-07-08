import type {
  CanonicalLine,
  Catalog,
  Deck,
  Etymology,
  SourceRef,
  SuttaRec,
  TalkSegment,
  WordCard,
} from './types.ts';

/** Deck content is authored by hand; fail loudly at load time, not mid-session. */
export class ContentError extends Error {}

function fail(path: string, message: string): never {
  throw new ContentError(`${path}: ${message}`);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(obj: Record<string, unknown>, key: string, path: string): string {
  const value = obj[key];
  if (typeof value !== 'string' || value.length === 0) {
    fail(path, `expected non-empty string "${key}"`);
  }
  return value;
}

function num(obj: Record<string, unknown>, key: string, path: string): number {
  const value = obj[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, `expected number "${key}"`);
  }
  return value;
}

function parseSource(raw: unknown, path: string): SourceRef {
  if (!isRecord(raw)) fail(path, 'expected source object');
  const type = str(raw, 'type', path);
  if (type !== 'sutta' && type !== 'dictionary') {
    fail(path, `unknown source type "${type}"`);
  }
  return { type, ref: str(raw, 'ref', path), url: str(raw, 'url', path) };
}

function parseEtymology(raw: unknown, path: string): Etymology {
  if (!isRecord(raw)) fail(path, 'expected etymology object');
  return { root: str(raw, 'root', path), note: str(raw, 'note', path) };
}

function parseCanonicalLine(raw: unknown, path: string): CanonicalLine {
  if (!isRecord(raw)) fail(path, 'expected canonical_line object');
  return {
    pali: str(raw, 'pali', path),
    translation: str(raw, 'translation', path),
    ref: str(raw, 'ref', path),
  };
}

function parseWord(raw: unknown, path: string): WordCard {
  if (!isRecord(raw)) fail(path, 'expected word object');
  const id = str(raw, 'id', path);
  const wordPath = `${path}(${id})`;
  const confusablesRaw = raw['confusables'];
  if (!Array.isArray(confusablesRaw)) fail(wordPath, 'expected confusables array');
  const confusables = confusablesRaw.map((c, i) => {
    if (typeof c !== 'string') fail(wordPath, `confusables[${String(i)}] must be a string`);
    return c;
  });
  const sourcesRaw = raw['sources'];
  if (!Array.isArray(sourcesRaw) || sourcesRaw.length === 0) {
    fail(wordPath, 'every word needs at least one source (ehipassiko)');
  }
  const word: WordCard = {
    id,
    pali: str(raw, 'pali', wordPath),
    gloss: str(raw, 'gloss', wordPath),
    cluster: str(raw, 'cluster', wordPath),
    confusables,
    sources: sourcesRaw.map((s, i) => parseSource(s, `${wordPath}.sources[${String(i)}]`)),
    pronunciation: str(raw, 'pronunciation', wordPath),
  };
  if (raw['literal'] !== undefined) word.literal = str(raw, 'literal', wordPath);
  if (raw['etymology'] !== undefined) {
    word.etymology = parseEtymology(raw['etymology'], `${wordPath}.etymology`);
  }
  if (raw['canonicalLine'] !== undefined) {
    word.canonicalLine = parseCanonicalLine(raw['canonicalLine'], `${wordPath}.canonicalLine`);
  }
  return word;
}

function parseTalkSegment(raw: unknown, path: string): TalkSegment {
  if (!isRecord(raw)) fail(path, 'expected talk segment object');
  if (typeof raw['text'] === 'string') return { kind: 'text', text: raw['text'] };
  if (typeof raw['term'] === 'string') {
    return { kind: 'term', term: raw['term'], surface: str(raw, 'surface', path) };
  }
  fail(path, 'talk segment needs either "text" or "term"+"surface"');
}

function parseSuttaRec(raw: unknown, path: string): SuttaRec {
  if (!isRecord(raw)) fail(path, 'expected suttaRec object');
  return {
    title: str(raw, 'title', path),
    ref: str(raw, 'ref', path),
    url: str(raw, 'url', path),
    blurb: str(raw, 'blurb', path),
    minutes: num(raw, 'minutes', path),
  };
}

function parseDeck(raw: unknown, index: number): Deck {
  const path = `decks[${String(index)}]`;
  if (!isRecord(raw)) fail(path, 'expected deck object');
  const id = str(raw, 'id', path);
  const deckPath = `deck(${id})`;
  const wordsRaw = raw['words'];
  if (!Array.isArray(wordsRaw) || wordsRaw.length === 0) {
    fail(deckPath, 'expected non-empty words array');
  }
  const talkRaw = raw['talk'];
  if (!Array.isArray(talkRaw) || talkRaw.length === 0) {
    fail(deckPath, 'expected non-empty talk array');
  }
  return {
    id,
    name: str(raw, 'name', deckPath),
    paliName: str(raw, 'paliName', deckPath),
    order: num(raw, 'order', deckPath),
    intro: str(raw, 'intro', deckPath),
    words: wordsRaw.map((w, i) => parseWord(w, `${deckPath}.words[${String(i)}]`)),
    talk: talkRaw.map((s, i) => parseTalkSegment(s, `${deckPath}.talk[${String(i)}]`)),
    suttaRec: parseSuttaRec(raw['suttaRec'], `${deckPath}.suttaRec`),
  };
}

/**
 * Parse and cross-check the full deck set. Throws ContentError on any
 * structural problem, dangling reference, or ordering violation.
 */
export function buildCatalog(rawDecks: unknown, familiarity: readonly string[]): Catalog {
  if (!Array.isArray(rawDecks)) {
    throw new ContentError('deck set: expected an array of decks');
  }
  const decks = rawDecks.map(parseDeck).sort((a, b) => a.order - b.order);

  const deckById = new Map<string, Deck>();
  const orders = new Set<number>();
  const words = new Map<string, WordCard>();
  const deckOf = new Map<string, Deck>();

  for (const deck of decks) {
    if (deckById.has(deck.id)) fail(`deck(${deck.id})`, 'duplicate deck id');
    deckById.set(deck.id, deck);
    if (orders.has(deck.order)) fail(`deck(${deck.id})`, `duplicate order ${String(deck.order)}`);
    orders.add(deck.order);
    for (const word of deck.words) {
      if (words.has(word.id)) fail(`deck(${deck.id})`, `duplicate word id "${word.id}"`);
      if (word.cluster !== deck.id) {
        fail(`word(${word.id})`, `cluster "${word.cluster}" does not match deck "${deck.id}"`);
      }
      words.set(word.id, word);
      deckOf.set(word.id, deck);
    }
  }

  for (const word of words.values()) {
    for (const confusable of word.confusables) {
      if (confusable === word.id) fail(`word(${word.id})`, 'confusable points at itself');
      if (!words.has(confusable)) {
        fail(`word(${word.id})`, `confusable "${confusable}" does not resolve`);
      }
    }
  }

  for (const deck of decks) {
    for (const segment of deck.talk) {
      if (segment.kind !== 'term') continue;
      const owner = deckOf.get(segment.term);
      if (owner === undefined) {
        fail(`deck(${deck.id})`, `talk term "${segment.term}" does not resolve`);
      }
      if (owner.order > deck.order) {
        fail(
          `deck(${deck.id})`,
          `talk term "${segment.term}" belongs to a later deck (${owner.id}); ` +
            'talk paragraphs may only use vocabulary from this deck or earlier',
        );
      }
    }
  }

  for (const id of familiarity) {
    if (!words.has(id)) {
      throw new ContentError(`familiarity id "${id}" does not resolve`);
    }
  }

  return { decks, words, deckById, deckOf, familiarity };
}

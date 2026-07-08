import type { Catalog, Deck, SuttaRec } from '../data/types.ts';
import { drillFor } from './mastery.ts';
import type { DrillKind, Mastery } from './mastery.ts';
import { isDue } from './srs.ts';
import type { Card } from 'ts-fsrs';

export interface WordSnapshot {
  id: string;
  card: Card | null;
  mastery: Mastery;
}

export type SessionItem =
  | { kind: 'intro' | DrillKind; wordId: string }
  | { kind: 'talk'; deckId: string };

export interface SessionPlan {
  items: SessionItem[];
}

export interface SessionOptions {
  minutes: number;
  maxNew: number;
}

/** A drill takes roughly twenty seconds; the bound is a ceiling, not a quota (§5). */
const ITEMS_PER_MINUTE = 3;

/**
 * Plan one bounded session (§5): due reviews first, then introductions from
 * the earliest unfinished deck (intro card before any drill, §4.3), closing
 * with at most one talk paragraph (§3.4/§4.4).
 */
export function planSession(
  words: readonly WordSnapshot[],
  catalog: Catalog,
  opts: SessionOptions,
  now: Date,
): SessionPlan {
  const capacity = Math.max(1, Math.floor(opts.minutes * ITEMS_PER_MINUTE));
  const byId = new Map(words.map((w) => [w.id, w]));
  const items: SessionItem[] = [];

  const due = words
    .filter((w): w is WordSnapshot & { card: Card } => w.card !== null && isDue(w.card, now))
    .sort((a, b) => a.card.due.getTime() - b.card.due.getTime());
  for (const snapshot of due) {
    if (items.length >= capacity) break;
    items.push({ kind: drillFor(snapshot.mastery.stage), wordId: snapshot.id });
  }

  // Introductions: earliest deck with untouched words, in authored order.
  const introducedDecks = new Set<string>();
  let introduced = 0;
  for (const deck of catalog.decks) {
    const untouched = deck.words.filter((w) => byId.get(w.id)?.card === null);
    if (untouched.length === 0) continue;
    for (const word of untouched) {
      // An intro plus its first drill cost two slots.
      if (introduced >= opts.maxNew || items.length + 2 > capacity) break;
      items.push({ kind: 'intro', wordId: word.id });
      items.push({ kind: 'recognition', wordId: word.id });
      introduced++;
      introducedDecks.add(deck.id);
    }
    break; // one deck's material at a time — anupubba
  }

  const talkDeck = pickTalkDeck(catalog, byId, introducedDecks, items);
  if (talkDeck !== null) {
    items.push({ kind: 'talk', deckId: talkDeck.id });
  }

  return { items };
}

function pickTalkDeck(
  catalog: Catalog,
  byId: ReadonlyMap<string, WordSnapshot>,
  introducedDecks: ReadonlySet<string>,
  items: readonly SessionItem[],
): Deck | null {
  // A deck freshly completed by this session's introductions graduates into
  // its talk paragraph ("I can already follow this", §4.4)...
  for (const deck of catalog.decks) {
    if (!introducedDecks.has(deck.id)) continue;
    const everyWordTouched = deck.words.every((w) => {
      const snapshot = byId.get(w.id);
      const inSession = items.some((i) => i.kind === 'intro' && i.wordId === w.id);
      return inSession || (snapshot !== undefined && snapshot.card !== null);
    });
    if (everyWordTouched) return deck;
  }
  // ...otherwise the deck with the most comprehension-stage words in this
  // session gets a re-read, which is how comprehension reps accrue (§3.4).
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.kind === 'talk' || item.kind === 'intro') continue;
    if (byId.get(item.wordId)?.mastery.stage !== 'comprehension') continue;
    const deck = catalog.deckOf.get(item.wordId);
    if (deck === undefined) continue;
    counts.set(deck.id, (counts.get(deck.id) ?? 0) + 1);
  }
  let best: Deck | null = null;
  let bestCount = 0;
  for (const [deckId, count] of counts) {
    const deck = catalog.decks.find((d) => d.id === deckId);
    if (deck !== undefined && count > bestCount) {
      best = deck;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The closing screen points beyond the app (§5): recommend the sutta of the
 * deck most worked this session.
 */
export function recommendSutta(plan: SessionPlan, catalog: Catalog): SuttaRec {
  const counts = new Map<string, number>();
  for (const item of plan.items) {
    const deck =
      item.kind === 'talk'
        ? catalog.decks.find((d) => d.id === item.deckId)
        : catalog.deckOf.get(item.wordId);
    if (deck !== undefined) counts.set(deck.id, (counts.get(deck.id) ?? 0) + 1);
  }
  let best: Deck | undefined;
  let bestCount = 0;
  for (const deck of catalog.decks) {
    const count = counts.get(deck.id) ?? 0;
    if (count >= bestCount && count > 0) {
      best = deck;
      bestCount = count;
    }
  }
  const chosen = best ?? catalog.decks[0];
  if (chosen === undefined) {
    throw new Error('catalog has no decks');
  }
  return chosen.suttaRec;
}

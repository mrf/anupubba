import { describe, expect, it } from 'vitest';
import { buildCatalog } from './validate.ts';

function word(id: string, cluster: string, over: Record<string, unknown> = {}) {
  return {
    id,
    pali: id,
    gloss: `gloss of ${id}`,
    cluster,
    confusables: [],
    sources: [
      { type: 'dictionary', ref: `dpd:${id}`, url: `https://dpdict.net/?q=${id}` },
    ],
    pronunciation: id.toUpperCase(),
    ...over,
  };
}

function deck(id: string, order: number, over: Record<string, unknown> = {}) {
  return {
    id,
    name: `Deck ${id}`,
    paliName: id,
    order,
    intro: `About ${id}.`,
    words: [word(`${id}-a`, id), word(`${id}-b`, id)],
    talk: [
      { text: 'When ' },
      { term: `${id}-a`, surface: `${id}-a` },
      { text: ' arises, it is seen.' },
    ],
    suttaRec: {
      title: 'Some Sutta',
      ref: 'sn1.1',
      url: 'https://suttacentral.net/sn1.1',
      blurb: 'A short read.',
      minutes: 5,
    },
    ...over,
  };
}

describe('buildCatalog', () => {
  it('accepts a well-formed deck set and indexes it', () => {
    const catalog = buildCatalog([deck('one', 1), deck('two', 2)], ['one-a']);
    expect(catalog.decks.map((d) => d.id)).toEqual(['one', 'two']);
    expect(catalog.words.get('two-b')?.gloss).toBe('gloss of two-b');
    expect(catalog.deckOf.get('one-a')?.id).toBe('one');
    expect(catalog.familiarity).toEqual(['one-a']);
  });

  it('sorts decks by order regardless of input order', () => {
    const catalog = buildCatalog([deck('later', 2), deck('first', 1)], []);
    expect(catalog.decks.map((d) => d.id)).toEqual(['first', 'later']);
  });

  it('normalizes talk segments into kind-tagged unions', () => {
    const catalog = buildCatalog([deck('one', 1)], []);
    const talk = catalog.decks[0]?.talk ?? [];
    expect(talk[0]).toEqual({ kind: 'text', text: 'When ' });
    expect(talk[1]).toEqual({ kind: 'term', term: 'one-a', surface: 'one-a' });
  });

  it('rejects non-array input', () => {
    expect(() => buildCatalog({ nope: true }, [])).toThrow(/array/i);
  });

  it('rejects duplicate word ids across decks', () => {
    const clash = deck('two', 2, { words: [word('one-a', 'two')] });
    expect(() => buildCatalog([deck('one', 1), clash], [])).toThrow(/duplicate.*one-a/i);
  });

  it('rejects duplicate deck ids and duplicate orders', () => {
    expect(() =>
      buildCatalog([deck('one', 1), deck('one', 2, { words: [word('x', 'one')] })], []),
    ).toThrow(/duplicate.*deck/i);
    expect(() => buildCatalog([deck('one', 1), deck('two', 1)], [])).toThrow(/order/i);
  });

  it('rejects a word whose cluster does not match its deck', () => {
    const bad = deck('one', 1, { words: [word('one-a', 'elsewhere')] });
    expect(() => buildCatalog([bad], [])).toThrow(/cluster/i);
  });

  it('rejects confusables that do not resolve or point at self', () => {
    const dangling = deck('one', 1, {
      words: [word('one-a', 'one', { confusables: ['ghost'] })],
      talk: [{ text: 'x' }],
    });
    expect(() => buildCatalog([dangling], [])).toThrow(/confusable.*ghost/i);
    const selfref = deck('one', 1, {
      words: [word('one-a', 'one', { confusables: ['one-a'] })],
      talk: [{ text: 'x' }],
    });
    expect(() => buildCatalog([selfref], [])).toThrow(/itself/i);
  });

  it('accepts confusables that point at earlier decks', () => {
    const later = deck('two', 2, {
      words: [word('two-a', 'two', { confusables: ['one-a'] })],
      talk: [{ text: 'x' }],
    });
    expect(() => buildCatalog([deck('one', 1), later], [])).not.toThrow();
  });

  it('rejects talk terms that are unknown or from later decks', () => {
    const unknown = deck('one', 1, {
      talk: [{ term: 'ghost', surface: 'ghost' }],
    });
    expect(() => buildCatalog([unknown], [])).toThrow(/talk.*ghost/i);
    // Talk paragraphs may only use vocabulary from this deck or earlier ones
    // (§3.4: constrained to known + in-progress vocabulary).
    const early = deck('one', 1, {
      talk: [{ term: 'two-a', surface: 'two-a' }],
    });
    expect(() => buildCatalog([early, deck('two', 2)], [])).toThrow(/later|earlier/i);
  });

  it('rejects words with no sources', () => {
    const unsourced = deck('one', 1, {
      words: [word('one-a', 'one', { sources: [] })],
      talk: [{ text: 'x' }],
    });
    expect(() => buildCatalog([unsourced], [])).toThrow(/source/i);
  });

  it('rejects familiarity ids that do not resolve', () => {
    expect(() => buildCatalog([deck('one', 1)], ['ghost'])).toThrow(/familiarity.*ghost/i);
  });

  it('rejects malformed segments and missing fields with a path in the message', () => {
    const malformed = deck('one', 1, { talk: [{ bogus: true }] });
    expect(() => buildCatalog([malformed], [])).toThrow(/talk/i);
    const missingGloss = deck('one', 1, {
      words: [word('one-a', 'one', { gloss: '' })],
      talk: [{ text: 'x' }],
    });
    expect(() => buildCatalog([missingGloss], [])).toThrow(/gloss/i);
  });
});

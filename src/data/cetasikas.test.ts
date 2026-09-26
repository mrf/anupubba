import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.ts';
import { CETASIKA_GROUPS, CETASIKAS } from './cetasikas.ts';
import type { CetasikaGroup } from './cetasikas.ts';

const CETASIKA_DECK_IDS = new Set(CETASIKA_GROUPS.flatMap((g) => g.deckIds));

function groupInfo(id: CetasikaGroup) {
  const info = CETASIKA_GROUPS.find((g) => g.id === id);
  if (info === undefined) throw new Error(`no group ${id}`);
  return info;
}

describe('the 52 cetasikas', () => {
  it('lists exactly 52 distinct factors in the chart proportions 7 / 6 / 14 / 25', () => {
    expect(CETASIKAS.length).toBe(52);
    expect(new Set(CETASIKAS.map((x) => x.wordId)).size).toBe(52);
    expect(new Set(CETASIKAS.map((x) => x.pali)).size).toBe(52);
    for (const group of CETASIKA_GROUPS) {
      const members = CETASIKAS.filter((x) => x.group === group.id);
      expect(members.length, group.id).toBe(group.count);
    }
  });

  it('keeps the chart subgroup sizes', () => {
    const bySub = new Map<string, number>();
    for (const x of CETASIKAS) bySub.set(x.subgroup, (bySub.get(x.subgroup) ?? 0) + 1);
    expect(Object.fromEntries(bySub)).toEqual({
      sabbacittasādhāraṇa: 7,
      pakiṇṇaka: 6,
      akusalasādhāraṇa: 4,
      'lobha-group': 3,
      'dosa-group': 4,
      'thīna-middha': 2,
      vicikicchā: 1,
      sobhanasādhāraṇa: 19,
      virati: 3,
      appamaññā: 2,
      paññindriya: 1,
    });
  });

  it('every factor is a shipped word with the chart spelling', () => {
    for (const x of CETASIKAS) {
      const word = catalog.words.get(x.wordId);
      expect(word, x.wordId).toBeDefined();
      expect(word?.pali, x.wordId).toBe(x.pali);
    }
  });

  it('every group name on the chart is a deck', () => {
    for (const group of CETASIKA_GROUPS) {
      for (const deckId of group.deckIds) {
        expect(catalog.deckById.get(deckId), deckId).toBeDefined();
      }
    }
    expect(catalog.deckById.get('cetasikas-universals')?.paliName).toContain('sabbacittasādhāraṇa');
    expect(catalog.deckById.get('cetasikas-occasionals')?.paliName).toContain('pakiṇṇaka');
    expect(catalog.deckById.get('cetasikas-unwholesome')?.paliName).toContain('akusala');
    expect(catalog.deckById.get('cetasikas-beautiful-common')?.paliName).toContain('sobhana');
    expect(catalog.deckById.get('cetasikas-beautiful-special')?.paliName).toContain('virati');
  });

  it('every factor is grouped correctly: in its group deck, or an earlier deck named by it', () => {
    const cetasikaOrders = [...CETASIKA_DECK_IDS].map((id) => catalog.deckById.get(id)?.order ?? 0);
    const firstCetasikaOrder = Math.min(...cetasikaOrders);
    for (const x of CETASIKAS) {
      const owner = catalog.deckOf.get(x.wordId);
      expect(owner, x.wordId).toBeDefined();
      if (owner === undefined) continue;
      const group = groupInfo(x.group);
      if (CETASIKA_DECK_IDS.has(owner.id)) {
        expect(group.deckIds, `${x.wordId} sits in ${owner.id}`).toContain(owner.id);
        continue;
      }
      // Taught earlier on the gradual path; the group deck must still name it.
      expect(owner.order, `${x.wordId} owned by ${owner.id}`).toBeLessThan(firstCetasikaOrder);
      const named = group.deckIds.some((deckId) =>
        catalog.deckById
          .get(deckId)
          ?.talk.some((seg) => seg.kind === 'term' && seg.term === x.wordId),
      );
      expect(named, `${x.wordId} is not named in any ${x.group} deck's talk`).toBe(true);
    }
  });

  it('cetasika decks contain only cetasikas', () => {
    const ids = new Set(CETASIKAS.map((x) => x.wordId));
    for (const deckId of CETASIKA_DECK_IDS) {
      for (const word of catalog.deckById.get(deckId)?.words ?? []) {
        expect(ids.has(word.id), `${word.id} in ${deckId} is not on the chart`).toBe(true);
      }
    }
  });
});

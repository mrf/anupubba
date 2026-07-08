import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_META, deleteStore, openStore } from './store.ts';
import { initialMastery } from './mastery.ts';
import { newWordState, reviewWord } from './srs.ts';

const NOW = new Date('2026-07-08T12:00:00Z');

beforeEach(async () => {
  await deleteStore();
});

describe('store', () => {
  it('starts with defaults: zero cultivation count, not onboarded', async () => {
    const store = await openStore();
    const meta = await store.loadMeta();
    expect(meta).toEqual(DEFAULT_META);
    expect(meta.cultivationCount).toBe(0);
    expect(meta.onboarded).toBe(false);
    store.close();
  });

  it('round-trips word state including FSRS dates', async () => {
    const store = await openStore();
    const card = reviewWord(newWordState(NOW), 'clear', NOW);
    await store.putWordState({ id: 'sati', card, mastery: { stage: 'recall', streak: 1 } });
    const words = await store.loadWordStates();
    const sati = words.get('sati');
    expect(sati?.mastery).toEqual({ stage: 'recall', streak: 1 });
    expect(sati?.card.due).toBeInstanceOf(Date);
    expect(sati?.card.due.getTime()).toBe(card.due.getTime());
    store.close();
  });

  it('persists meta updates', async () => {
    const store = await openStore();
    await store.putMeta({ ...DEFAULT_META, cultivationCount: 108, onboarded: true });
    const meta = await store.loadMeta();
    expect(meta.cultivationCount).toBe(108);
    expect(meta.onboarded).toBe(true);
    store.close();
  });

  it('exports and re-imports the full state (data belongs to the user, §8)', async () => {
    const store = await openStore();
    const card = reviewWord(newWordState(NOW), 'familiar', NOW);
    await store.putWordState({ id: 'metta', card, mastery: initialMastery() });
    await store.putMeta({ ...DEFAULT_META, cultivationCount: 7 });
    const json = await store.exportJson(NOW);

    store.close();
    await deleteStore();
    const fresh = await openStore();
    expect((await fresh.loadMeta()).cultivationCount).toBe(0);

    await fresh.importJson(json);
    expect((await fresh.loadMeta()).cultivationCount).toBe(7);
    const metta = (await fresh.loadWordStates()).get('metta');
    expect(metta?.card.due.getTime()).toBe(card.due.getTime());
    expect(metta?.card.stability).toBe(card.stability);
    fresh.close();
  });

  it('rejects malformed imports without clobbering existing state', async () => {
    const store = await openStore();
    await store.putMeta({ ...DEFAULT_META, cultivationCount: 3 });
    await expect(store.importJson('{"nope": true}')).rejects.toThrow(/import/i);
    await expect(store.importJson('not json')).rejects.toThrow();
    expect((await store.loadMeta()).cultivationCount).toBe(3);
    store.close();
  });
});

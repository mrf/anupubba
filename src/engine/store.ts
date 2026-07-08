import { deleteDB, openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Card } from 'ts-fsrs';
import { isRecord } from '../data/validate.ts';
import { MASTERY_LADDER } from './mastery.ts';
import type { Mastery } from './mastery.ts';

export interface WordState {
  id: string;
  card: Card;
  mastery: Mastery;
}

export interface Settings {
  /** Session bound in minutes (§5). */
  minutes: number;
  /** New introductions per session (§4.3). */
  maxNew: number;
  bell: boolean;
}

export interface Meta {
  /** Lifetime cultivation count — never resets (§2). */
  cultivationCount: number;
  onboarded: boolean;
  lesson0Done: boolean;
  settings: Settings;
}

export const DEFAULT_META: Meta = {
  cultivationCount: 0,
  onboarded: false,
  lesson0Done: false,
  settings: { minutes: 7, maxNew: 3, bell: true },
};

const DB_NAME = 'anupubba';
const META_KEY = 'meta';

interface AnupubbaDB extends DBSchema {
  wordState: { key: string; value: WordState };
  meta: { key: string; value: Meta };
}

export interface Store {
  loadMeta: () => Promise<Meta>;
  putMeta: (meta: Meta) => Promise<void>;
  loadWordStates: () => Promise<Map<string, WordState>>;
  putWordState: (state: WordState) => Promise<void>;
  exportJson: (now: Date) => Promise<string>;
  importJson: (json: string) => Promise<void>;
  close: () => void;
}

export async function deleteStore(): Promise<void> {
  await deleteDB(DB_NAME);
}

interface ExportedCard extends Omit<Card, 'due' | 'last_review'> {
  due: string;
  last_review?: string;
}

interface ExportedWord {
  id: string;
  card: ExportedCard;
  mastery: Mastery;
}

interface ExportFile {
  app: 'anupubba';
  version: 1;
  exportedAt: string;
  meta: Meta;
  words: ExportedWord[];
}

function serializeCard(card: Card): ExportedCard {
  const { due, last_review, ...rest } = card;
  const out: ExportedCard = { ...rest, due: due.toISOString() };
  if (last_review !== undefined) out.last_review = last_review.toISOString();
  return out;
}

function reviveCard(card: ExportedCard): Card {
  const { due, last_review, ...rest } = card;
  const out: Card = { ...rest, due: new Date(due) };
  if (last_review !== undefined) out.last_review = new Date(last_review);
  return out;
}

const STAGES: readonly string[] = MASTERY_LADDER;

function isExportFile(value: unknown): value is ExportFile {
  if (!isRecord(value)) return false;
  if (value['app'] !== 'anupubba' || value['version'] !== 1) return false;
  if (!isRecord(value['meta'])) return false;
  const words = value['words'];
  if (!Array.isArray(words)) return false;
  return words.every((word: unknown) => {
    if (!isRecord(word)) return false;
    const mastery = word['mastery'];
    const card = word['card'];
    return (
      typeof word['id'] === 'string' &&
      isRecord(card) &&
      typeof card['due'] === 'string' &&
      !Number.isNaN(Date.parse(card['due'])) &&
      isRecord(mastery) &&
      typeof mastery['stage'] === 'string' &&
      STAGES.includes(mastery['stage']) &&
      typeof mastery['streak'] === 'number'
    );
  });
}

export async function openStore(): Promise<Store> {
  const db: IDBPDatabase<AnupubbaDB> = await openDB<AnupubbaDB>(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore('wordState', { keyPath: 'id' });
      database.createObjectStore('meta');
    },
  });

  const loadMeta = async (): Promise<Meta> => (await db.get('meta', META_KEY)) ?? DEFAULT_META;

  return {
    loadMeta,
    putMeta: async (meta) => {
      await db.put('meta', meta, META_KEY);
    },
    loadWordStates: async () => {
      const all = await db.getAll('wordState');
      return new Map(all.map((w) => [w.id, w]));
    },
    putWordState: async (state) => {
      await db.put('wordState', state);
    },
    exportJson: async (now) => {
      const words = await db.getAll('wordState');
      const file: ExportFile = {
        app: 'anupubba',
        version: 1,
        exportedAt: now.toISOString(),
        meta: await loadMeta(),
        words: words.map((w) => ({ ...w, card: serializeCard(w.card) })),
      };
      return JSON.stringify(file, null, 2);
    },
    importJson: async (json) => {
      const parsed: unknown = JSON.parse(json);
      if (!isExportFile(parsed)) {
        throw new Error('import failed: not an anupubba export file');
      }
      const tx = db.transaction(['wordState', 'meta'], 'readwrite');
      await tx.objectStore('wordState').clear();
      for (const word of parsed.words) {
        await tx.objectStore('wordState').put({ ...word, card: reviveCard(word.card) });
      }
      await tx.objectStore('meta').put(parsed.meta, META_KEY);
      await tx.done;
    },
    close: () => {
      db.close();
    },
  };
}

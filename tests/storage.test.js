// Tests for v2 storage: empty state, migration from v1, recovery, backup and the export reminder.

import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  createEmptyState,
  loadState,
  saveState,
  migrateFromV1,
  normalizeState,
  serializeBackup,
  parseBackup,
  backupFileName,
  markExported,
  needsExportReminder,
} from '../src/state/storage.js';

const NOW = new Date('2026-10-12T18:00:00Z');
const DAY_MS = 864e5;

// A stand-in for localStorage that keeps everything in a Map.
function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    keys: () => [...data.keys()],
  };
}

// v1 data as the old app saved it.
const V1_SESSIONS = [
  { date: '2026-09-20T19:30:00.000Z', mins: 25 },
  { date: '2026-10-10T20:00:00.000Z', mins: 40 },
  { date: '2026-10-11T08:15:00.000Z', mins: 1 },
];
const V1_RATINGS = { C: 60, Am: 90, F: 20 };

// ─── Empty state ───

describe('empty state', () => {
  it('matches the plan section 10 shape', () => {
    const state = createEmptyState(NOW);
    expect(state.schemaVersion).toBe(2);
    expect(state.settings).toEqual({ name: 'Baranay', leftHanded: false, sound: 'clean', restDaysPerWeek: 1 });
    expect(state.items).toEqual({});
    expect(state.reps).toEqual([]);
    expect(state.bests).toEqual({});
    expect(state.sessions).toEqual([]);
    expect(state.milestones).toEqual([]);
    expect(state.ear).toEqual({ results: [] });
  });

  it('is saved on first load when there is no data at all', () => {
    const storage = createFakeStorage();
    const state = loadState(storage, NOW);
    expect(state.sessions).toEqual([]);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

// ─── Migration ───

describe('migration from v1', () => {
  it('carries every session over with its minutes and end time', () => {
    const state = migrateFromV1({ sessions: V1_SESSIONS, chordProgress: {} }, NOW);
    expect(state.sessions).toHaveLength(3);
    expect(state.sessions.map((session) => session.minutes)).toEqual([25, 40, 1]);
    expect(state.sessions.map((session) => session.end)).toEqual(V1_SESSIONS.map((session) => session.date));
    expect(state.sessions[1].start).toBe('2026-10-10T19:20:00.000Z');
    expect(state.sessions.every((session) => session.id && session.source === 'v1')).toBe(true);
  });

  it('drops self-rated chord % and leaves a one-time notice', () => {
    const state = migrateFromV1({ sessions: [], chordProgress: V1_RATINGS }, NOW);
    expect(state.meta.notices.chordRatingsDropped).toEqual({ ratedChords: 3, dismissed: false });
    expect(JSON.stringify(state)).not.toContain('"Am":90');
  });

  it('adds no notice when nothing was rated', () => {
    const state = migrateFromV1({ sessions: V1_SESSIONS, chordProgress: {} }, NOW);
    expect(state.meta.notices.chordRatingsDropped).toBeUndefined();
  });

  it('skips broken v1 sessions instead of failing', () => {
    const state = migrateFromV1({ sessions: [null, { date: 'x' }, { mins: 3 }, V1_SESSIONS[0]], chordProgress: null }, NOW);
    expect(state.sessions).toHaveLength(1);
  });

  it('runs on first load, keeps the v1 keys, and does not run twice', () => {
    const storage = createFakeStorage({
      tempo_sess: JSON.stringify(V1_SESSIONS),
      tempo_cprog: JSON.stringify(V1_RATINGS),
    });
    const first = loadState(storage, NOW);
    expect(first.sessions).toHaveLength(3);
    expect(storage.getItem('tempo_sess')).not.toBeNull();
    expect(storage.getItem('tempo_cprog')).not.toBeNull();

    storage.setItem('tempo_sess', JSON.stringify([...V1_SESSIONS, { date: NOW.toISOString(), mins: 9 }]));
    const second = loadState(storage, NOW);
    expect(second.sessions).toHaveLength(3);
    expect(second.sessions.map((session) => session.id)).toEqual(first.sessions.map((session) => session.id));
  });

  it('copes with unreadable v1 JSON', () => {
    const storage = createFakeStorage({ tempo_sess: '{broken', tempo_cprog: 'also broken' });
    const state = loadState(storage, NOW);
    expect(state.sessions).toEqual([]);
  });
});

// ─── Recovery and checks ───

describe('reading saved data', () => {
  it('keeps a copy of unreadable data and starts empty', () => {
    const storage = createFakeStorage({ [STORAGE_KEY]: '{not json' });
    const state = loadState(storage, NOW);
    expect(state.sessions).toEqual([]);
    expect(state.meta.notices.unreadableData).toBeDefined();
    expect(storage.getItem(`${STORAGE_KEY}_unreadable_${NOW.getTime()}`)).toBe('{not json');
  });

  it('fills in missing parts with defaults', () => {
    const state = normalizeState({ schemaVersion: 2, sessions: [{ id: 'a', minutes: 5 }] });
    expect(state.sessions).toHaveLength(1);
    expect(state.settings.name).toBe('Baranay');
    expect(state.ear.results).toEqual([]);
  });

  it('refuses data from a newer version or that is not Tempo data', () => {
    expect(() => normalizeState({ schemaVersion: 3 })).toThrow(/newer version/);
    expect(() => normalizeState([])).toThrow(/not Tempo data/);
    expect(() => normalizeState({ hello: 1 })).toThrow(/no version/);
  });

  it('saves and loads the same state', () => {
    const storage = createFakeStorage();
    const state = createEmptyState(NOW);
    state.settings.name = 'Ege';
    state.sessions.push({ id: 's1', start: NOW.toISOString(), end: NOW.toISOString(), minutes: 12, blocks: [], stub: null });
    saveState(state, storage);
    expect(loadState(storage, NOW)).toEqual(state);
  });
});

// ─── Backup ───

describe('backup', () => {
  it('round-trips through a backup file', () => {
    const state = migrateFromV1({ sessions: V1_SESSIONS, chordProgress: V1_RATINGS }, NOW);
    state.reps.push({ id: 'r1', itemId: 'voicing:C:open', at: NOW.toISOString(), kind: 'clean-check', clean: false, mistakes: ['buzz:B'] });
    const text = serializeBackup(state, NOW);
    expect(JSON.parse(text).exportedAt).toBe(NOW.toISOString());
    expect(parseBackup(text)).toEqual(state);
  });

  it('explains what is wrong with a bad file', () => {
    expect(() => parseBackup('hello')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"schemaVersion": 99}')).toThrow(/newer version/);
  });

  it('names backup files by date', () => {
    expect(backupFileName(NOW)).toBe('tempo-backup-2026-10-12.json');
  });
});

// ─── Export reminder ───

describe('export reminder', () => {
  it('stays quiet with no data', () => {
    const state = createEmptyState(new Date(NOW.getTime() - 90 * DAY_MS));
    expect(needsExportReminder(state, NOW)).toBe(false);
  });

  it('appears 30 days after the last export', () => {
    const state = migrateFromV1({ sessions: V1_SESSIONS, chordProgress: {} }, new Date(NOW.getTime() - 40 * DAY_MS));
    expect(needsExportReminder(state, NOW)).toBe(true);
    markExported(state, new Date(NOW.getTime() - 29 * DAY_MS));
    expect(needsExportReminder(state, NOW)).toBe(false);
    expect(needsExportReminder(state, new Date(NOW.getTime() + DAY_MS))).toBe(true);
  });
});

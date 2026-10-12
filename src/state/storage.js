// Saves all of Tempo's data as one versioned object in localStorage under "tempo"
// (TEMPO_PLAN.md section 10). Also moves v1 data across, and exports / imports backups.
//
// The v1 keys ("tempo_sess", "tempo_cprog") are read once and left in place as a safety copy.

export const STORAGE_KEY = 'tempo';
export const SCHEMA_VERSION = 2;
export const EXPORT_REMINDER_DAYS = 30;

const V1_SESSIONS_KEY = 'tempo_sess';
const V1_CHORD_PROGRESS_KEY = 'tempo_cprog';
const DAY_MS = 864e5;

// The loaded state, shared by every page. Filled on first use.
let cachedState = null;

// ─── Empty state ───

// Returns a fresh, empty v2 state object.
export function createEmptyState(now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { name: 'Baranay', leftHanded: false, sound: 'clean', restDaysPerWeek: 1 },
    items: {},
    reps: [],
    bests: {},
    sessions: [],
    milestones: [],
    ear: { results: [] },
    meta: { createdAt: now.toISOString(), lastExportAt: null, notices: {} },
  };
}

// Returns a new unique id for a session, rep or other record.
export function makeId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Loading and saving ───

// Returns the app's state, loading (and if needed migrating) it the first time.
export function getState() {
  if (!cachedState) cachedState = loadState();
  return cachedState;
}

// Changes the state with `change(state)`, then saves it.
export function updateState(change) {
  const state = getState();
  change(state);
  saveState(state);
  return state;
}

// Replaces the whole state (used by backup import) and saves it.
export function replaceState(newState) {
  cachedState = newState;
  saveState(newState);
}

// Reads the state from storage. Migrates v1 data the first time, or starts empty.
export function loadState(storage = defaultStorage(), now = new Date()) {
  const saved = storage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch (error) {
      return recoverFromUnreadableData(storage, saved, now, error);
    }
  }

  const state = hasV1Data(storage) ? migrateFromV1(readV1Data(storage), now) : createEmptyState(now);
  saveState(state, storage);
  return state;
}

// Writes the state to storage as JSON.
export function saveState(state, storage = defaultStorage()) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Keeps a copy of data that can't be read, then starts empty so the app still opens.
function recoverFromUnreadableData(storage, savedText, now, error) {
  storage.setItem(`${STORAGE_KEY}_unreadable_${now.getTime()}`, savedText);
  const state = createEmptyState(now);
  state.meta.notices.unreadableData = { at: now.toISOString(), reason: error.message };
  saveState(state, storage);
  return state;
}

// Returns the browser's localStorage.
function defaultStorage() {
  return globalThis.localStorage;
}

// ─── Checking and repairing ───

// Checks a state object and fills in anything missing with defaults.
// Throws a readable error if it isn't Tempo data or comes from a newer version.
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('This is not Tempo data.');
  }
  if (typeof raw.schemaVersion !== 'number') {
    throw new Error('This is not Tempo data (no version number).');
  }
  if (raw.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`This data is from a newer version of Tempo (version ${raw.schemaVersion}). Update the app first.`);
  }

  const empty = createEmptyState(raw.meta && raw.meta.createdAt ? new Date(raw.meta.createdAt) : new Date());
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...empty.settings, ...objectOr(raw.settings) },
    items: objectOr(raw.items),
    reps: arrayOr(raw.reps),
    bests: objectOr(raw.bests),
    sessions: arrayOr(raw.sessions),
    milestones: arrayOr(raw.milestones),
    ear: { results: arrayOr(raw.ear && raw.ear.results) },
    meta: { ...empty.meta, ...objectOr(raw.meta), notices: objectOr(raw.meta && raw.meta.notices) },
  };
}

// Returns `value` if it is a plain object, otherwise an empty object.
function objectOr(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

// Returns `value` if it is an array, otherwise an empty array.
function arrayOr(value) {
  return Array.isArray(value) ? value : [];
}

// ─── Migration from v1 ───

// Returns true if the old v1 keys hold any data.
function hasV1Data(storage) {
  return storage.getItem(V1_SESSIONS_KEY) !== null || storage.getItem(V1_CHORD_PROGRESS_KEY) !== null;
}

// Reads the two v1 keys, treating unreadable JSON as empty.
function readV1Data(storage) {
  return {
    sessions: safeParse(storage.getItem(V1_SESSIONS_KEY), []),
    chordProgress: safeParse(storage.getItem(V1_CHORD_PROGRESS_KEY), {}),
  };
}

// Parses JSON, returning `fallback` if it is missing or broken.
function safeParse(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// Builds a v2 state from v1 data. Sessions keep their minutes and date.
// Self-rated chord % is not carried over (it didn't measure anything); a one-time notice records that.
export function migrateFromV1(v1, now = new Date()) {
  const state = createEmptyState(now);
  const v1Sessions = Array.isArray(v1.sessions) ? v1.sessions : [];

  state.sessions = v1Sessions
    .filter((session) => session && session.date && Number.isFinite(session.mins))
    .map(convertV1Session);

  const ratedChords = Object.keys(objectOr(v1.chordProgress)).length;
  if (ratedChords > 0) {
    state.meta.notices.chordRatingsDropped = { ratedChords, dismissed: false };
  }
  state.meta.migratedFromV1At = now.toISOString();
  return state;
}

// Turns one v1 session { date, mins } into a v2 session. v1 saved the date when the timer stopped.
function convertV1Session(v1Session) {
  const end = new Date(v1Session.date);
  const start = new Date(end.getTime() - v1Session.mins * 60000);
  return {
    id: makeId(),
    start: start.toISOString(),
    end: end.toISOString(),
    minutes: v1Session.mins,
    blocks: [],
    stub: null,
    source: 'v1',
  };
}

// ─── Backup ───

// Turns the state into backup file text.
export function serializeBackup(state, now = new Date()) {
  return JSON.stringify({ ...state, exportedAt: now.toISOString() }, null, 2);
}

// Reads backup file text into a checked state. Throws a readable error if it can't.
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Tempo backup (it is not valid JSON).');
  }
  const state = normalizeState(raw);
  delete state.exportedAt;
  return state;
}

// Returns the file name for a backup made on `now`, e.g. "tempo-backup-2026-10-12.json".
export function backupFileName(now = new Date()) {
  return `tempo-backup-${now.toISOString().slice(0, 10)}.json`;
}

// Downloads the current state as a backup file and records the export date.
export function downloadBackup(now = new Date()) {
  const state = getState();
  const blob = new Blob([serializeBackup(state, now)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = backupFileName(now);
  link.click();
  URL.revokeObjectURL(link.href);
  updateState((current) => markExported(current, now));
}

// Reads a backup file the user picked and makes it the current state.
export async function importBackupFile(file) {
  const state = parseBackup(await file.text());
  replaceState(state);
  return state;
}

// Records that a backup was just exported.
export function markExported(state, now = new Date()) {
  state.meta.lastExportAt = now.toISOString();
  return state;
}

// Returns true when there is data worth saving and the last backup is 30+ days old.
export function needsExportReminder(state, now = new Date()) {
  const hasData = state.sessions.length > 0 || state.reps.length > 0 || state.ear.results.length > 0;
  if (!hasData) return false;
  const since = new Date(state.meta.lastExportAt || state.meta.createdAt);
  return now.getTime() - since.getTime() >= EXPORT_REMINDER_DAYS * DAY_MS;
}

// ─── Test support ───

// Forgets the cached state so the next getState() reads storage again.
export function resetStateCache() {
  cachedState = null;
}

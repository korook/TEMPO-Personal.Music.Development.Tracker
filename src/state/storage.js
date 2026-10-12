// Reads and writes practice data in localStorage.
// These are the v1 keys ("tempo_sess" and "tempo_cprog"), unchanged.
// Phase 1 replaces this with the versioned "tempo" object and a migration (TEMPO_PLAN.md section 10).

const SESSIONS_KEY = 'tempo_sess';
const CHORD_PROGRESS_KEY = 'tempo_cprog';

// ─── Sessions ───

// Returns the list of logged sessions: [{ date: ISO string, mins: number }].
export function loadSessions() {
  return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
}

// Saves the full list of sessions, replacing what was stored.
export function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// ─── Chord progress (self-rated %, v1 only) ───

// Returns the self-rated mastery per chord: { C: 30, Am: 50, ... }.
export function loadChordProgress() {
  return JSON.parse(localStorage.getItem(CHORD_PROGRESS_KEY) || '{}');
}

// Saves the self-rated mastery per chord, replacing what was stored.
export function saveChordProgress(progress) {
  localStorage.setItem(CHORD_PROGRESS_KEY, JSON.stringify(progress));
}

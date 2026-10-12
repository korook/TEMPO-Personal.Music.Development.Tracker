// TEMPORARY: the v1 self-rated chord % ("+10% / −10%"), still used by the Guitar page,
// Dashboard mastery grid and Progress bars until Phase 4 replaces them with measured practice.
// Kept under its v1 key on purpose: it is not part of the v2 data and is not migrated.

const CHORD_PROGRESS_KEY = 'tempo_cprog';

// ─── Chord ratings ───

// Returns the self-rated mastery per chord: { C: 30, Am: 50, ... }.
export function loadChordProgress() {
  return JSON.parse(localStorage.getItem(CHORD_PROGRESS_KEY) || '{}');
}

// Saves the self-rated mastery per chord, replacing what was stored.
export function saveChordProgress(progress) {
  localStorage.setItem(CHORD_PROGRESS_KEY, JSON.stringify(progress));
}

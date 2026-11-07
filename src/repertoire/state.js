// Repertoire state (TEMPO_UPDATE_REPERTOIRE.md 2 and 9). Each part is "not yet", "learning"
// or "got it"; the song's state is worked out from its parts and run-throughs, never set by
// hand:
//   Learning        some part isn't "got it" yet
//   Played through  every part is "got it"
//   Stage-ready     every part "got it", plus two run-throughs at 100% with no stops, on
//                   different days. A later run with stops drops it back; time alone never does.
// A Stage-ready song past its spacing interval is "Encore due" (plan 6.6), like any rusty item.

import { findSong } from './songs.js';
import { SPACING } from '../practice/spacing.js';

const DAY_MS = 864e5;

// ─── Labels ───

export const PART_STATES = ['not-yet', 'learning', 'got-it'];
export const PART_LABELS = { 'not-yet': 'Not yet', learning: 'Learning', 'got-it': 'Got it' };
export const SONG_LABELS = { learning: 'Learning', 'played-through': 'Played through', 'stage-ready': 'Stage-ready' };

// The tempo ladder for run-throughs and part loops, as % of the original tempo.
export const TEMPO_LADDER = [70, 85, 100];

// ─── Adding and changing ───

// Adds a song to the repertoire (changes `state`). `known` = "I already know this": every
// part starts as "got it", so known songs don't need to be entered part by part.
export function addSong(state, song, { known = false, now = new Date() } = {}) {
  const parts = Object.fromEntries((song.parts || []).map((part) => [part.id, known ? 'got-it' : 'not-yet']));
  state.repertoire.songs[song.id] = {
    addedAt: now.toISOString(),
    lastPlayedAt: known ? null : now.toISOString(),
    parts,
    runs: [],
    reviewIntervalDays: SPACING.firstIntervalDays,
    capo: song.capo || 0,
  };
  return state.repertoire.songs[song.id];
}

// Sets one part's state (changes `state`) and marks the song as touched now.
export function setPartState(state, songId, partId, partState, now = new Date()) {
  const entry = state.repertoire.songs[songId];
  if (!entry || !PART_STATES.includes(partState)) return;
  entry.parts[partId] = partState;
  entry.lastPlayedAt = now.toISOString();
}

// Saves a run-through (changes `state`): tempo as % of the original, and how many stops.
// A clean run makes the review interval longer; a run with stops sends it back to one day.
export function recordRun(state, songId, { tempoPct, stops }, now = new Date()) {
  const entry = state.repertoire.songs[songId];
  if (!entry) return;
  entry.runs.push({ at: now.toISOString(), tempoPct, stops });
  entry.lastPlayedAt = now.toISOString();
  if (stops === 0 && tempoPct >= 100) {
    entry.reviewIntervalDays = Math.min(SPACING.maxIntervalDays, (entry.reviewIntervalDays || 1) * SPACING.cleanMultiplier);
  } else if (stops > 0) {
    entry.reviewIntervalDays = SPACING.firstIntervalDays;
  }
}

// ─── Reading ───

// The state of one part (parts that were added later count as "not yet").
export function partState(entry, partId) {
  return (entry && entry.parts[partId]) || 'not-yet';
}

// The song's state: 'learning', 'played-through' or 'stage-ready' (see the top of this file).
export function songState(song, entry) {
  const allGot = (song.parts || []).length > 0 && song.parts.every((part) => partState(entry, part.id) === 'got-it');
  if (!allGot) return 'learning';
  return cleanFullDays(entry.runs).size >= 2 ? 'stage-ready' : 'played-through';
}

// The different days with a clean run at full tempo, counted since the last run that had stops.
function cleanFullDays(runs) {
  let days = new Set();
  for (const run of runs) {
    if (run.stops > 0) days = new Set();
    else if (run.tempoPct >= 100) days.add(run.at.slice(0, 10));
  }
  return days;
}

// How many parts are "got it", e.g. { got: 3, total: 4 }.
export function partsDone(song, entry) {
  return { got: song.parts.filter((part) => partState(entry, part.id) === 'got-it').length, total: song.parts.length };
}

// The next part to work on: the first one learning, else the first not yet (null when all are got).
export function nextPart(song, entry) {
  return song.parts.find((part) => partState(entry, part.id) === 'learning')
    || song.parts.find((part) => partState(entry, part.id) === 'not-yet')
    || null;
}

// The highest ladder step played with no stops (null if none yet).
export function bestCleanTempo(entry) {
  const clean = (entry ? entry.runs : []).filter((run) => run.stops === 0).map((run) => run.tempoPct);
  return clean.length ? Math.max(...clean) : null;
}

// The ladder step to play next: one above the best clean run (or the first step).
export function nextLadderStep(entry) {
  const best = bestCleanTempo(entry);
  return TEMPO_LADDER.find((step) => best === null || step > best) || TEMPO_LADDER[TEMPO_LADDER.length - 1];
}

// True when a Stage-ready song is past its review interval ("Encore due").
export function isEncoreDue(song, entry, now = new Date()) {
  if (songState(song, entry) !== 'stage-ready' || !entry.lastPlayedAt) return false;
  return (now.getTime() - new Date(entry.lastPlayedAt).getTime()) / DAY_MS >= (entry.reviewIntervalDays || 1);
}

// Days since the song was last played (null if never).
export function daysSincePlayed(entry, now = new Date()) {
  if (!entry || !entry.lastPlayedAt) return null;
  return Math.floor((now.getTime() - new Date(entry.lastPlayedAt).getTime()) / DAY_MS);
}

// Every song in the repertoire with its data and state: [{ song, entry, state }], skipping
// ids whose song data can't be found.
export function repertoireSongs(state) {
  return Object.entries(state.repertoire.songs)
    .map(([id, entry]) => {
      const song = findSong(id, state);
      return song ? { song, entry, state: songState(song, entry) } : null;
    })
    .filter(Boolean);
}

// The "Now learning" song: the one touched most recently that isn't Stage-ready (or null).
export function nowLearning(state) {
  return repertoireSongs(state)
    .filter((row) => row.state !== 'stage-ready')
    .sort((a, b) => (b.entry.lastPlayedAt || b.entry.addedAt).localeCompare(a.entry.lastPlayedAt || a.entry.addedAt))[0] || null;
}

// Plain-language progress line, e.g. "3 of 4 parts down. The chorus is next."
export function progressLine(song, entry) {
  const { got, total } = partsDone(song, entry);
  const next = nextPart(song, entry);
  if (!next) {
    const best = bestCleanTempo(entry);
    if (songState(song, entry) === 'stage-ready') return 'Stage-ready. Keep it fresh with an encore now and then.';
    return best === null ? 'Every part down. Try a run-through at 70%.' : `Clean at ${best}%. Try ${nextLadderStep(entry)}%.`;
  }
  return `${got} of ${total} part${total === 1 ? '' : 's'} down. The ${next.name.toLowerCase()} is next.`;
}

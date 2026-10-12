// Practice items (TEMPO_PLAN.md 6.2): the things that get practiced and measured.
//   voicing      one chord shape            "voicing:C|x-3-2-0-1-0"
//   pair         changing between 2 chords  "pair:C-G"
//   progression  a chord progression        "progression:Am-F-C-G"
//   exercise     a finger exercise          "exercise:spider-walk"
// Items live in state.items, keyed by id.

import { getVoicingsForSymbol } from '../chords/voicings.js';
import { fretKey } from '../chords/shapes.js';

// ─── Ids ───

// Returns the id for one chord shape.
export function voicingItemId(voicing) {
  return `voicing:${voicing.id}`;
}

// Returns the id for changing between two chords. C↔G and G↔C are the same item.
export function pairItemId(first, second) {
  return `pair:${[first, second].sort().join('-')}`;
}

// Returns the id for a progression, e.g. ['Am', 'F', 'C', 'G'] → "progression:Am-F-C-G".
export function progressionItemId(chords) {
  return `progression:${chords.join('-')}`;
}

// Turns an exercise name into its id, e.g. "Spider walk" → "exercise:spider-walk".
export function exerciseItemId(name) {
  return `exercise:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

// ─── Creating ───

// Builds a new item record.
export function makeItem(id, type, details, now = new Date()) {
  return {
    id,
    type,
    ...details,
    createdAt: now.toISOString(),
    reviewIntervalDays: 1,
    lastPracticedAt: null,
  };
}

// Returns the item for a chord shape. `chord` is the plain chord ("C", even for a C/E shape).
export function voicingItem(voicing, now) {
  return makeItem(voicingItemId(voicing), 'voicing', {
    chord: voicing.id.split('|')[0],
    frets: fretKey(voicing.frets),
    label: voicing.shape === 'open' ? `${voicing.symbol} open` : `${voicing.symbol} ${voicing.shape}, fret ${voicing.position}`,
  }, now);
}

// Returns the item for changing between two chords.
export function pairItem(first, second, now) {
  return makeItem(pairItemId(first, second), 'pair', { chords: [first, second], label: `${first} ↔ ${second}` }, now);
}

// Returns the item for a progression.
export function progressionItem(chords, now) {
  return makeItem(progressionItemId(chords), 'progression', { chords, label: chords.join('–') }, now);
}

// Returns the item for a finger exercise.
export function exerciseItem(name, now) {
  return makeItem(exerciseItemId(name), 'exercise', { label: name }, now);
}

// Adds an item to the state if it isn't there yet, and returns the stored item.
export function ensureItem(state, item) {
  if (!state.items[item.id]) state.items[item.id] = item;
  return state.items[item.id];
}

// ─── Reading ───

// Returns the shape a voicing item points at (or null if it can't be found).
export function voicingForItem(item) {
  if (item.type !== 'voicing') return null;
  return getVoicingsForSymbol(item.chord).find((voicing) => fretKey(voicing.frets) === item.frets) || null;
}

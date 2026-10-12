// Intervals written as degree labels ("1", "b3", "#5", "9"), their size in semitones,
// and how to spell the note an interval above a root.

import { parseNoteName, noteNameToPitchClass, spellOnLetter, letterAbove, mod12 } from './notes.js';

// ─── Interval table ───

// Semitones above the root for each label used in scales and chords.
const SEMITONES = {
  '1': 0, 'b2': 1, '2': 2, '#2': 3, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
  '#5': 8, 'b6': 8, '6': 9, 'bb7': 9, 'b7': 10, '7': 11,
  'b9': 13, '9': 14, '#9': 15, '11': 17, '#11': 18, 'b13': 20, '13': 21,
};

// Full names for the labels a learner meets first (ear training, theory lessons).
export const INTERVAL_NAMES = {
  '1': 'unison', 'b2': 'minor 2nd', '2': 'major 2nd', 'b3': 'minor 3rd', '3': 'major 3rd',
  '4': 'perfect 4th', '#4': 'tritone', 'b5': 'tritone', '5': 'perfect 5th', '#5': 'augmented 5th',
  'b6': 'minor 6th', '6': 'major 6th', 'bb7': 'diminished 7th', 'b7': 'minor 7th', '7': 'major 7th',
  '9': 'major 9th',
};

// ─── Reading labels ───

// Returns the size of an interval label in semitones, e.g. "b3" → 3.
export function intervalSemitones(label) {
  if (!(label in SEMITONES)) throw new Error(`Unknown interval "${label}".`);
  return SEMITONES[label];
}

// Returns the scale degree number in a label, e.g. "b7" → 7, "#11" → 11.
export function intervalDegree(label) {
  return Number(label.replace(/[#b]/g, ''));
}

// Returns the label shown on the fretboard: the root shows as "R", the rest as written.
export function displayLabel(label) {
  return label === '1' ? 'R' : label;
}

// ─── Spelling ───

// Spells the note `label` above `rootName`, e.g. ("Bb", "3") → "D", ("C", "b3") → "Eb".
export function spellInterval(rootName, label) {
  const { letter } = parseNoteName(rootName);
  const targetLetter = letterAbove(letter, (intervalDegree(label) - 1) % 7);
  const targetPitchClass = mod12(noteNameToPitchClass(rootName) + intervalSemitones(label));
  return spellOnLetter(targetLetter, targetPitchClass);
}

// Returns the distance in semitones (0–11) going up from one pitch class to another.
export function semitonesBetween(fromPitchClass, toPitchClass) {
  return mod12(toPitchClass - fromPitchClass);
}

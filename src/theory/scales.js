// Scales and modes as lists of degree labels, with correctly spelled notes for any root.

import { spellInterval, intervalSemitones } from './intervals.js';
import { noteNameToPitchClass, mod12 } from './notes.js';

// ─── Scale list ───

// Each scale: a readable name and its degrees from the root.
export const SCALES = {
  'major': { name: 'Major', degrees: ['1', '2', '3', '4', '5', '6', '7'] },
  'natural-minor': { name: 'Natural minor', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  'harmonic-minor': { name: 'Harmonic minor', degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
  'melodic-minor': { name: 'Melodic minor', degrees: ['1', '2', 'b3', '4', '5', '6', '7'] },
  'major-pentatonic': { name: 'Major pentatonic', degrees: ['1', '2', '3', '5', '6'] },
  'minor-pentatonic': { name: 'Minor pentatonic', degrees: ['1', 'b3', '4', '5', 'b7'] },
  'blues': { name: 'Blues', degrees: ['1', 'b3', '4', 'b5', '5', 'b7'] },
  'ionian': { name: 'Ionian', degrees: ['1', '2', '3', '4', '5', '6', '7'] },
  'dorian': { name: 'Dorian', degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  'phrygian': { name: 'Phrygian', degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] },
  'lydian': { name: 'Lydian', degrees: ['1', '2', '3', '#4', '5', '6', '7'] },
  'mixolydian': { name: 'Mixolydian', degrees: ['1', '2', '3', '4', '5', '6', 'b7'] },
  'aeolian': { name: 'Aeolian', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  'locrian': { name: 'Locrian', degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] },
};

// ─── Building scales ───

// Returns the spelled notes of a scale, e.g. ("F", "major") → F G A Bb C D E.
export function scaleNotes(rootName, scaleId) {
  return getScale(scaleId).degrees.map((label) => spellInterval(rootName, label));
}

// Returns the pitch classes (0–11) of a scale on a root.
export function scalePitchClasses(rootName, scaleId) {
  const rootPitchClass = noteNameToPitchClass(rootName);
  return getScale(scaleId).degrees.map((label) => mod12(rootPitchClass + intervalSemitones(label)));
}

// Looks up a scale by id, with a clear error for a typo.
function getScale(scaleId) {
  const scale = SCALES[scaleId];
  if (!scale) throw new Error(`Unknown scale "${scaleId}".`);
  return scale;
}

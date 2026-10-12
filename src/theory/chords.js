// Chord qualities (TEMPO_PLAN.md section 5.2): formulas, required tones, symbols,
// spelled chord tones, and parsing chord symbols such as "C#m7b5" or "C/E".
// The chord engine (Phase 2) builds every voicing from these formulas.

import { spellInterval, intervalSemitones } from './intervals.js';
import { noteNameToPitchClass, preferredRootName, mod12 } from './notes.js';

// ─── Chord qualities ───

// Each quality: chord symbol suffix, readable name, tones as degree labels,
// which tones a voicing must contain, and whether it counts as minor-family for root naming.
// Triads must keep their 5th; only 7th chords and add9 may leave it out (plan 5.2).
export const CHORD_QUALITIES = {
  'major': { suffix: '', name: 'major', tones: ['1', '3', '5'], required: ['1', '3', '5'], minorFamily: false },
  'minor': { suffix: 'm', name: 'minor', tones: ['1', 'b3', '5'], required: ['1', 'b3', '5'], minorFamily: true },
  'power': { suffix: '5', name: 'power chord', tones: ['1', '5'], required: ['1', '5'], minorFamily: false },
  'dominant7': { suffix: '7', name: 'dominant 7th', tones: ['1', '3', '5', 'b7'], required: ['1', '3', 'b7'], minorFamily: false },
  'major7': { suffix: 'maj7', name: 'major 7th', tones: ['1', '3', '5', '7'], required: ['1', '3', '7'], minorFamily: false },
  'minor7': { suffix: 'm7', name: 'minor 7th', tones: ['1', 'b3', '5', 'b7'], required: ['1', 'b3', 'b7'], minorFamily: true },
  'sus2': { suffix: 'sus2', name: 'suspended 2nd', tones: ['1', '2', '5'], required: ['1', '2', '5'], minorFamily: false },
  'sus4': { suffix: 'sus4', name: 'suspended 4th', tones: ['1', '4', '5'], required: ['1', '4', '5'], minorFamily: false },
  'add9': { suffix: 'add9', name: 'add 9', tones: ['1', '3', '5', '9'], required: ['1', '3', '9'], minorFamily: false },
  'diminished': { suffix: 'dim', name: 'diminished', tones: ['1', 'b3', 'b5'], required: ['1', 'b3', 'b5'], minorFamily: true },
  'augmented': { suffix: 'aug', name: 'augmented', tones: ['1', '3', '#5'], required: ['1', '3', '#5'], minorFamily: false },
  'half-diminished': { suffix: 'm7b5', name: 'half-diminished', tones: ['1', 'b3', 'b5', 'b7'], required: ['1', 'b3', 'b5', 'b7'], minorFamily: true },
};

// Quality ids in the order they appear in pickers.
export const QUALITY_ORDER = Object.keys(CHORD_QUALITIES);

// ─── Looking up chords ───

// Returns a quality by id, with a clear error for a typo.
export function getQuality(qualityId) {
  const quality = CHORD_QUALITIES[qualityId];
  if (!quality) throw new Error(`Unknown chord quality "${qualityId}".`);
  return quality;
}

// Returns the usual root name for a pitch class and quality, e.g. (1, "minor") → "C#".
export function rootNameFor(pitchClass, qualityId) {
  return preferredRootName(pitchClass, getQuality(qualityId).minorFamily);
}

// Returns every chord: 12 roots × all qualities, each { root, quality, symbol }.
export function allChords() {
  const chords = [];
  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    for (const qualityId of QUALITY_ORDER) {
      const root = rootNameFor(pitchClass, qualityId);
      chords.push({ root, quality: qualityId, symbol: chordSymbol(root, qualityId) });
    }
  }
  return chords;
}

// ─── Symbols ───

// Writes a chord symbol, e.g. ("C", "minor7") → "Cm7", or with a bass note ("C", "major", "E") → "C/E".
export function chordSymbol(rootName, qualityId, bassName = null) {
  const symbol = rootName + getQuality(qualityId).suffix;
  return bassName && bassName !== rootName ? `${symbol}/${bassName}` : symbol;
}

// Reads a chord symbol like "Bbmaj7" or "C/E" into { root, quality, bass }.
export function parseChordSymbol(symbol) {
  const match = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(symbol.trim());
  if (!match) throw new Error(`"${symbol}" is not a chord symbol.`);
  const [, root, suffix, bass] = match;
  const qualityId = QUALITY_ORDER.find((id) => CHORD_QUALITIES[id].suffix === suffix);
  if (!qualityId) throw new Error(`Unknown chord type "${suffix}" in "${symbol}".`);
  return { root, quality: qualityId, bass: bass || null };
}

// ─── Chord tones ───

// Returns the spelled tones of a chord, e.g. ("Bb", "major") →
// [{ label: "1", note: "Bb", pitchClass: 10 }, { label: "3", note: "D", ... }, ...].
export function chordTones(rootName, qualityId) {
  const rootPitchClass = noteNameToPitchClass(rootName);
  return getQuality(qualityId).tones.map((label) => ({
    label,
    note: spellInterval(rootName, label),
    pitchClass: mod12(rootPitchClass + intervalSemitones(label)),
  }));
}

// Returns the degree label of `pitchClass` in the chord, or null if it is not a chord tone.
export function labelForPitchClass(rootName, qualityId, pitchClass) {
  const tone = chordTones(rootName, qualityId).find((candidate) => candidate.pitchClass === mod12(pitchClass));
  return tone ? tone.label : null;
}

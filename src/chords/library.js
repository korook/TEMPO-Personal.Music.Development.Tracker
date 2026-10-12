// How the chord library is organised on the Chords page (TEMPO_PLAN.md 5.5):
// seven categories, A to G. Each category holds the natural root and, where there is one,
// the sharp/flat root that goes with that letter (C# / Db in C, Eb in E, F# in F,
// Ab in A, Bb in B). Every root shows all 14 chord types; each thumbnail shows the most
// common shape (the open one if it exists).

import { SHARP_NAMES, LETTERS, noteNameToPitchClass, mod12 } from '../theory/notes.js';
import { QUALITY_ORDER, rootNameFor, chordSymbol, getQuality } from '../theory/chords.js';
import { getVoicings } from './voicings.js';

// ─── Categories ───

// The letters in page order, A to G.
export const CATEGORY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Pitch classes in each category: the natural root first, then its sharp/flat neighbour.
const CATEGORY_PITCH_CLASSES = {
  A: [9, 8],
  B: [11, 10],
  C: [0, 1],
  D: [2],
  E: [4, 3],
  F: [5, 6],
  G: [7],
};

// Flat names for the five black keys, for row labels such as "C♯ / D♭".
const FLAT_NAMES = { 1: 'Db', 3: 'Eb', 6: 'Gb', 8: 'Ab', 10: 'Bb' };

// Returns the rows of one category: [{ pitchClass, label, chords: [{ root, quality, symbol, name }] }].
export function getCategory(letter) {
  const pitchClasses = CATEGORY_PITCH_CLASSES[letter];
  if (!pitchClasses) throw new Error(`Unknown chord category "${letter}".`);
  return pitchClasses.map((pitchClass) => ({
    pitchClass,
    label: rowLabel(pitchClass),
    chords: QUALITY_ORDER.map((quality) => {
      const root = rootNameFor(pitchClass, quality);
      return { root, quality, symbol: chordSymbol(root, quality), name: getQuality(quality).name };
    }),
  }));
}

// Returns the category letter a root belongs to, e.g. "C#" → "C", "Db" → "C", "Bb" → "B".
export function categoryOfRoot(rootName) {
  const pitchClass = noteNameToPitchClass(rootName);
  return CATEGORY_LETTERS.find((letter) => CATEGORY_PITCH_CLASSES[letter].includes(mod12(pitchClass)));
}

// Writes a row label: "C" for a natural, "C♯ / D♭" for a black key.
function rowLabel(pitchClass) {
  const sharp = SHARP_NAMES[pitchClass];
  if (sharp.length === 1) return sharp;
  return `${prettyAccidentals(sharp)} / ${prettyAccidentals(FLAT_NAMES[pitchClass])}`;
}

// Swaps # and b for the proper ♯ and ♭ signs, for display only.
export function prettyAccidentals(name) {
  return name.replace(/#/g, '♯').replace(/(?<=[A-G0-9])b/g, '♭');
}

// ─── Thumbnails ───

// Shape families in the order a guitarist usually reaches for them.
const COMMON_SHAPES = [
  (voicing) => voicing.shape === 'open',
  (voicing) => voicing.shape === 'E-form barre' || voicing.shape === 'A-form barre',
  (voicing) => voicing.shape === 'E-string root' || voicing.shape === 'A-string root',
  (voicing) => !voicing.shape.startsWith('triad'),
];

// Returns the shape a thumbnail shows: the open shape if there is one, then the classic
// E- or A-form barre, then a shape rooted on the E or A string, then any full shape.
// Within a family the lowest on the neck wins (voicings are already ordered that way).
export function thumbnailVoicing(root, quality) {
  const standard = getVoicings(root, quality, { found: false });
  for (const isFamily of COMMON_SHAPES) {
    const match = standard.find(isFamily);
    if (match) return match;
  }
  return standard[0];
}

// True if every one of the 12 roots appears in exactly one category (used by tests).
export function categoriesCoverEveryRoot() {
  const all = Object.values(CATEGORY_PITCH_CLASSES).flat();
  return all.length === 12 && new Set(all).size === 12 && LETTERS.every((letter) => CATEGORY_LETTERS.includes(letter));
}

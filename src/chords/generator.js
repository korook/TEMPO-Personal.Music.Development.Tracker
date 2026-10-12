// Builds raw chord voicings (TEMPO_PLAN.md section 5.3):
//   1. standard shapes: open chords, movable templates placed at every fret, triads on string sets;
//   2. found shapes: a search over frets 0–15 for anything playable that contains the chord.
// Each raw voicing is { frets, fingers, damped, source, shape, form }. voicings.js turns
// them into full voicing records (names, intervals, difficulty).

import { STANDARD_TUNING, noteNameToPitchClass, mod12 } from '../theory/notes.js';
import { chordTones, getQuality } from '../theory/chords.js';
import { computeFingering } from './fingering.js';
import {
  OPEN_SHAPES,
  MOVABLE_SHAPES,
  TRIAD_STRING_SETS,
  TRIAD_QUALITIES,
  parseFretText,
  parseFingerText,
} from './shapes.js';

export const HIGHEST_FRET = 15;
export const MAX_SPAN = 4;
export const STRETCH_SPAN = 5;
// Found shapes may mix open strings with fretted notes only up to this fret.
const OPEN_STRING_REACH = 7;

// ─── Pitch helpers ───

// Returns the MIDI note sounding on `string` at `fret`.
export function midiAt(string, fret) {
  return STANDARD_TUNING[string] + fret;
}

// Returns the pitch class (0–11) sounding on `string` at `fret`.
export function pitchClassAt(string, fret) {
  return mod12(midiAt(string, fret));
}

// Returns how many frets a shape spans, counting fretted notes only (open strings don't count).
// Frets 3 to 6 span 4 frets.
export function fretSpan(frets) {
  const fretted = frets.filter((fret) => Number.isInteger(fret) && fret > 0);
  if (fretted.length === 0) return 0;
  return Math.max(...fretted) - Math.min(...fretted) + 1;
}

// ─── Standard: open chords ───

// Returns the open shapes for this chord (matched by pitch class, so "A#" finds nothing and "Bb" works).
export function openVoicings(root, quality) {
  const rootPitchClass = noteNameToPitchClass(root);
  return OPEN_SHAPES
    .filter((shape) => shape.quality === quality && noteNameToPitchClass(shape.root) === rootPitchClass)
    .map((shape) => ({
      frets: parseFretText(shape.frets),
      fingers: parseFingerText(shape.fingers),
      damped: [],
      source: 'standard',
      shape: 'open',
      form: null,
    }));
}

// ─── Standard: movable shapes ───

// Places every movable template for this chord at each fret where it fits on the neck.
export function movableVoicings(root, quality) {
  const templates = MOVABLE_SHAPES[quality] || [];
  const rootPitchClass = noteNameToPitchClass(root);
  const voicings = [];
  for (const template of templates) {
    const firstFret = mod12(rootPitchClass - STANDARD_TUNING[template.rootString]);
    // Try the root at its lowest fret and an octave higher.
    for (let rootFret = firstFret; rootFret <= HIGHEST_FRET; rootFret += 12) {
      const placed = placeTemplate(template, rootFret);
      if (placed) voicings.push(placed);
    }
  }
  return voicings;
}

// Puts a template's root at `rootFret`. Returns null if any fingered note would fall
// off the neck or onto an open string (open versions come from OPEN_SHAPES instead).
function placeTemplate(template, rootFret) {
  const frets = [];
  const damped = [];
  for (let string = 0; string < 6; string++) {
    const offset = template.offsets[string];
    if (offset === null || offset === 'damped') {
      frets.push(null);
      if (offset === 'damped') damped.push(string);
      continue;
    }
    const fret = rootFret + offset;
    if (fret < 1 || fret > HIGHEST_FRET) return null;
    frets.push(fret);
  }
  return {
    frets,
    fingers: [...template.fingers],
    damped,
    source: 'standard',
    shape: shapeName(template),
    form: template.form,
  };
}

// Names a template: "E-form barre", "C-form", or "A-string root" for non-CAGED shapes.
function shapeName(template) {
  if (template.form.endsWith('-root')) return `${template.form[0]}-string root`;
  const fingered = template.fingers.filter((finger) => finger > 0);
  const hasBarre = new Set(fingered).size < fingered.length;
  const isClassicBarre = hasBarre && (template.form === 'E' || template.form === 'A');
  return isClassicBarre ? `${template.form}-form barre` : `${template.form}-form`;
}

// ─── Standard: triads ───

// Builds close-position triads (root position, 1st and 2nd inversion) on the top and
// middle string sets, at every position on the neck.
export function triadVoicings(root, quality) {
  if (!TRIAD_QUALITIES.includes(quality)) return [];
  const tones = chordTones(root, quality);
  const voicings = [];

  for (const stringSet of TRIAD_STRING_SETS) {
    for (let inversion = 0; inversion < 3; inversion++) {
      const order = [0, 1, 2].map((step) => tones[(inversion + step) % 3].pitchClass);
      for (let bassFret = 0; bassFret <= HIGHEST_FRET; bassFret++) {
        const frets = buildCloseTriad(stringSet.strings, order, bassFret);
        if (!frets) continue;
        const fingering = computeFingering(frets);
        if (!fingering) continue;
        voicings.push({
          frets,
          fingers: fingering.fingers,
          damped: [],
          source: 'standard',
          shape: `triad on ${stringSet.name}`,
          form: null,
        });
      }
    }
  }
  return voicings;
}

// Stacks three chord tones upward on three adjacent strings, all within one octave of the
// bass note and within the fret span limit. Returns 6-string frets, or null if it doesn't fit.
function buildCloseTriad(strings, pitchClassOrder, bassFret) {
  if (pitchClassAt(strings[0], bassFret) !== pitchClassOrder[0]) return null;
  const bassMidi = midiAt(strings[0], bassFret);
  const chosen = [bassFret];
  let previousMidi = bassMidi;

  for (let step = 1; step < 3; step++) {
    const string = strings[step];
    const fret = findFretAbove(string, pitchClassOrder[step], previousMidi, bassMidi + 12);
    if (fret === null) return null;
    chosen.push(fret);
    previousMidi = midiAt(string, fret);
  }

  const frets = [null, null, null, null, null, null];
  strings.forEach((string, index) => { frets[string] = chosen[index]; });
  return fretSpan(frets) <= MAX_SPAN ? frets : null;
}

// Finds the fret on `string` that plays `pitchClass` above `aboveMidi` and below `belowMidi`.
function findFretAbove(string, pitchClass, aboveMidi, belowMidi) {
  for (let fret = 0; fret <= HIGHEST_FRET; fret++) {
    const midi = midiAt(string, fret);
    if (midi > aboveMidi && midi < belowMidi && pitchClassAt(string, fret) === pitchClass) return fret;
  }
  return null;
}

// ─── Found: searching the neck ───

// Searches frets 0–15 for every playable voicing of the chord: only chord tones, all
// required tones, no muted strings between sounding ones, span ≤ 5 frets, and playable
// with 4 fingers and at most one barre. To keep the list useful (triads are already
// covered by standard shapes) found shapes use at least 4 strings (2 for power chords),
// and only mix in open strings while the hand stays in the first 7 frets.
// Returns raw voicings tagged "found".
export function searchVoicings(root, quality) {
  const tones = chordTones(root, quality);
  const chordPitchClasses = new Set(tones.map((tone) => tone.pitchClass));
  const requiredPitchClasses = tones
    .filter((tone) => getQuality(quality).required.includes(tone.label))
    .map((tone) => tone.pitchClass);
  const minStrings = quality === 'power' ? 2 : Math.max(4, requiredPitchClasses.length);

  const found = new Map();
  for (let windowStart = 1; windowStart <= HIGHEST_FRET; windowStart++) {
    const options = stringOptions(chordPitchClasses, windowStart);
    for (let lowString = 0; lowString < 6; lowString++) {
      for (let highString = lowString + minStrings - 1; highString < 6; highString++) {
        for (const frets of combinations(options, lowString, highString)) {
          const key = frets.join(',');
          if (found.has(key)) continue;
          if (!containsAll(frets, requiredPitchClasses)) continue;
          if (fretSpan(frets) > STRETCH_SPAN) continue;
          if (mixesOpenStringsHighUp(frets)) continue;
          const fingering = computeFingering(frets);
          if (!fingering) continue;
          found.set(key, { frets, fingers: fingering.fingers, damped: [], source: 'found', shape: 'found', form: null });
        }
      }
    }
  }
  return [...found.values()];
}

// For each string, lists the frets (open, or inside the 5-fret window) that play a chord tone.
function stringOptions(chordPitchClasses, windowStart) {
  return STANDARD_TUNING.map((_, string) => {
    const frets = [];
    if (chordPitchClasses.has(pitchClassAt(string, 0))) frets.push(0);
    for (let fret = windowStart; fret <= Math.min(HIGHEST_FRET, windowStart + STRETCH_SPAN - 1); fret++) {
      if (chordPitchClasses.has(pitchClassAt(string, fret))) frets.push(fret);
    }
    return frets;
  });
}

// Yields every 6-string fret list that sounds strings lowString..highString (others muted).
function* combinations(options, lowString, highString) {
  const frets = [null, null, null, null, null, null];
  function* fill(string) {
    if (string > highString) {
      yield [...frets];
      return;
    }
    for (const fret of options[string]) {
      frets[string] = fret;
      yield* fill(string + 1);
    }
    frets[string] = null;
  }
  yield* fill(lowString);
}

// True if the shape uses open strings together with notes above fret 7 (rarely practical).
function mixesOpenStringsHighUp(frets) {
  return frets.includes(0) && Math.max(...frets.filter(Number.isInteger)) > OPEN_STRING_REACH;
}

// True if the shape sounds every pitch class in `pitchClasses`.
function containsAll(frets, pitchClasses) {
  const sounding = new Set(
    frets.map((fret, string) => (fret === null ? null : pitchClassAt(string, fret))).filter((value) => value !== null),
  );
  return pitchClasses.every((pitchClass) => sounding.has(pitchClass));
}

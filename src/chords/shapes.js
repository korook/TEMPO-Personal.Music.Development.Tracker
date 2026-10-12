// Curated chord shapes (TEMPO_PLAN.md section 5.3): classic open chords, and movable
// templates (CAGED forms, E/A-form barres, power chords) that slide along the neck.
// These are the "standard" voicings, shown before generated ones.
// Every shape here is checked by tests/chords.test.js: notes, required tones, fingering.

// ─── Open chords ───

// Classic first-position shapes. frets: low E → high e ("x" = not played).
// fingers: same order, "0" = no finger (1 index, 2 middle, 3 ring, 4 pinky).
export const OPEN_SHAPES = [
  // Major
  { root: 'C', quality: 'major', frets: 'x32010', fingers: '032010' },
  { root: 'A', quality: 'major', frets: 'x02220', fingers: '001230' },
  { root: 'G', quality: 'major', frets: '320003', fingers: '210004' },
  { root: 'E', quality: 'major', frets: '022100', fingers: '023100' },
  { root: 'D', quality: 'major', frets: 'xx0232', fingers: '000132' },
  // Minor
  { root: 'A', quality: 'minor', frets: 'x02210', fingers: '002310' },
  { root: 'E', quality: 'minor', frets: '022000', fingers: '023000' },
  { root: 'D', quality: 'minor', frets: 'xx0231', fingers: '000231' },
  // Dominant 7
  { root: 'C', quality: 'dominant7', frets: 'x32310', fingers: '032410' },
  { root: 'A', quality: 'dominant7', frets: 'x02020', fingers: '002030' },
  { root: 'G', quality: 'dominant7', frets: '320001', fingers: '320001' },
  { root: 'E', quality: 'dominant7', frets: '020100', fingers: '020100' },
  { root: 'D', quality: 'dominant7', frets: 'xx0212', fingers: '000213' },
  { root: 'B', quality: 'dominant7', frets: 'x21202', fingers: '021304' },
  // Major 7
  { root: 'C', quality: 'major7', frets: 'x32000', fingers: '032000' },
  { root: 'A', quality: 'major7', frets: 'x02120', fingers: '002130' },
  { root: 'G', quality: 'major7', frets: '320002', fingers: '320001' },
  { root: 'E', quality: 'major7', frets: '021100', fingers: '031200' },
  { root: 'D', quality: 'major7', frets: 'xx0222', fingers: '000123' },
  { root: 'F', quality: 'major7', frets: 'xx3210', fingers: '003210' },
  // Minor 7
  { root: 'A', quality: 'minor7', frets: 'x02010', fingers: '002010' },
  { root: 'E', quality: 'minor7', frets: '022030', fingers: '012030' },
  { root: 'D', quality: 'minor7', frets: 'xx0211', fingers: '000211' },
  // Sus and add9
  { root: 'A', quality: 'sus2', frets: 'x02200', fingers: '001200' },
  { root: 'D', quality: 'sus2', frets: 'xx0230', fingers: '000130' },
  { root: 'A', quality: 'sus4', frets: 'x02230', fingers: '001240' },
  { root: 'D', quality: 'sus4', frets: 'xx0233', fingers: '000134' },
  { root: 'E', quality: 'sus4', frets: '022200', fingers: '023400' },
  { root: 'C', quality: 'add9', frets: 'x32033', fingers: '021034' },
  // Power chords and augmented
  { root: 'E', quality: 'power', frets: '022xxx', fingers: '012000' },
  { root: 'A', quality: 'power', frets: 'x022xx', fingers: '001200' },
  { root: 'D', quality: 'power', frets: 'xx023x', fingers: '000130' },
  { root: 'C', quality: 'augmented', frets: 'x32110', fingers: '043120' },
];

// ─── Movable shapes ───

// Templates that move along the neck. `rootString` holds the root at fret r;
// `offsets` are each string's fret relative to r (null = not played,
// "damped" = not played but sits between sounding strings, muted by a finger).
// `form` names the CAGED shape it comes from (or which string holds the root).
const x = null;
const d = 'damped';

export const MOVABLE_SHAPES = {
  'major': [
    { form: 'E', rootString: 0, offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] },
    { form: 'C', rootString: 1, offsets: [x, 0, -1, -3, -2, -3], fingers: [0, 4, 3, 1, 2, 1] },
    { form: 'G', rootString: 0, offsets: [0, -1, -3, -3, -3, 0], fingers: [3, 2, 1, 1, 1, 4] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 3, 2], fingers: [0, 0, 1, 2, 4, 3] },
  ],
  'minor': [
    { form: 'E', rootString: 0, offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] },
    { form: 'C', rootString: 1, offsets: [x, 0, -2, -3, -2, x], fingers: [0, 4, 2, 1, 3, 0] },
    { form: 'G', rootString: 0, offsets: [0, -2, -3, -3, 0, x], fingers: [3, 2, 1, 1, 4, 0] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 3, 1], fingers: [0, 0, 1, 3, 4, 2] },
  ],
  'dominant7': [
    { form: 'E', rootString: 0, offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] },
    { form: 'C', rootString: 1, offsets: [x, 0, -1, 0, -2, x], fingers: [0, 3, 2, 4, 1, 0] },
    { form: 'G', rootString: 0, offsets: [0, -1, -3, -3, -3, -2], fingers: [4, 3, 1, 1, 1, 2] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  ],
  'major7': [
    { form: 'E', rootString: 0, offsets: [0, d, 1, 1, 0, x], fingers: [1, 0, 3, 4, 2, 0] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] },
    { form: 'C', rootString: 1, offsets: [x, 0, -1, -3, -3, -3], fingers: [0, 3, 2, 1, 1, 1] },
    { form: 'G', rootString: 0, offsets: [0, -1, -3, -3, -3, -1], fingers: [4, 2, 1, 1, 1, 3] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 2, 2], fingers: [0, 0, 1, 2, 3, 4] },
  ],
  'minor7': [
    { form: 'E', rootString: 0, offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] },
    { form: 'C', rootString: 1, offsets: [x, 0, -2, 0, -2, x], fingers: [0, 3, 1, 4, 1, 0] },
    { form: 'G', rootString: 0, offsets: [0, -2, -3, -3, d, -2], fingers: [4, 2, 1, 1, 0, 3] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 1, 1], fingers: [0, 0, 1, 4, 2, 3] },
  ],
  'power': [
    { form: 'E-root', rootString: 0, offsets: [0, 2, 2, x, x, x], fingers: [1, 3, 4, 0, 0, 0] },
    { form: 'A-root', rootString: 1, offsets: [x, 0, 2, 2, x, x], fingers: [0, 1, 3, 4, 0, 0] },
  ],
  'sus2': [
    { form: 'E', rootString: 0, offsets: [0, 2, 4, 4, 0, 0], fingers: [1, 2, 3, 4, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 3, 0], fingers: [0, 0, 1, 3, 4, 1] },
  ],
  'sus4': [
    { form: 'E', rootString: 0, offsets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1] },
    { form: 'D', rootString: 2, offsets: [x, x, 0, 2, 3, 3], fingers: [0, 0, 1, 2, 3, 4] },
  ],
  'add9': [
    { form: 'C', rootString: 1, offsets: [x, 0, -1, -3, 0, x], fingers: [0, 3, 2, 1, 4, 0] },
    { form: 'E', rootString: 0, offsets: [0, 2, 4, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
    { form: 'A', rootString: 1, offsets: [x, 0, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 1] },
  ],
  'diminished': [
    { form: 'E-root', rootString: 0, offsets: [0, 1, 2, 0, x, x], fingers: [2, 3, 4, 1, 0, 0] },
    { form: 'A-root', rootString: 1, offsets: [x, 0, 1, 2, 1, x], fingers: [0, 1, 2, 4, 3, 0] },
  ],
  'augmented': [
    { form: 'E-root', rootString: 0, offsets: [0, d, 2, 1, 1, x], fingers: [1, 0, 4, 2, 3, 0] },
    { form: 'A-root', rootString: 1, offsets: [x, 0, -1, -2, -2, x], fingers: [0, 4, 3, 1, 2, 0] },
  ],
  'half-diminished': [
    { form: 'E-root', rootString: 0, offsets: [0, d, 0, 0, -1, x], fingers: [2, 0, 3, 4, 1, 0] },
    { form: 'A-root', rootString: 1, offsets: [x, 0, 1, 0, 1, x], fingers: [0, 1, 3, 2, 4, 0] },
    { form: 'D-root', rootString: 2, offsets: [x, x, 0, 1, 1, 1], fingers: [0, 0, 1, 2, 3, 4] },
  ],
};

// ─── Triads ───

// String sets for three-note triads: top strings (G B e) and middle strings (D G B).
export const TRIAD_STRING_SETS = [
  { name: 'G–B–e', strings: [3, 4, 5] },
  { name: 'D–G–B', strings: [2, 3, 4] },
];

// Qualities that have three notes, so they get triad shapes.
export const TRIAD_QUALITIES = ['major', 'minor', 'diminished', 'augmented', 'sus2', 'sus4'];

// ─── Reading shape text ───

// Turns "x32010" into [null, 3, 2, 0, 1, 0].
export function parseFretText(text) {
  return [...text].map((char) => (char === 'x' ? null : Number(char)));
}

// Turns "032010" into [0, 3, 2, 0, 1, 0].
export function parseFingerText(text) {
  return [...text].map(Number);
}

// Writes frets back as text, e.g. [null, 3, 5, 5, 5, 3] → "x-3-5-5-5-3" (dashes allow frets ≥ 10).
export function fretKey(frets) {
  return frets.map((fret) => (fret === null ? 'x' : fret)).join('-');
}

// Note names, pitch classes, root spelling, MIDI numbers and the guitar's standard tuning.
// Shared by the chord engine, the guitar synth and ear training.

// ─── Letters and pitch classes ───

// The seven note letters in order, starting from C.
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Pitch class (0–11, C = 0) of each natural note.
const LETTER_PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// One name per pitch class, using sharps. Only for display when no key is known.
export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ─── Root names ───

// Root names for major-family chords, following the simpler key signature
// (Db major has 5 flats, C# major has 7 sharps, so Db wins).
const MAJOR_ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Root names for minor-family chords (C#m has 4 sharps, Dbm would need 8 flats).
const MINOR_ROOT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

// Returns the usual name for a root, e.g. pitch class 1 → "Db" (major) or "C#" (minor).
export function preferredRootName(pitchClass, isMinorFamily = false) {
  const names = isMinorFamily ? MINOR_ROOT_NAMES : MAJOR_ROOT_NAMES;
  return names[mod12(pitchClass)];
}

// ─── Parsing and spelling ───

// Splits a note name like "Bb" into its letter ("B") and accidental offset (−1).
export function parseNoteName(noteName) {
  const match = /^([A-Ga-g])([#♯b♭]*)$/.exec(noteName.trim());
  if (!match) throw new Error(`"${noteName}" is not a note name.`);
  const letter = match[1].toUpperCase();
  let offset = 0;
  for (const sign of match[2]) offset += sign === '#' || sign === '♯' ? 1 : -1;
  return { letter, offset };
}

// Returns the pitch class (0–11) of a note name, e.g. "Bb" → 10, "E#" → 5.
export function noteNameToPitchClass(noteName) {
  const { letter, offset } = parseNoteName(noteName);
  return mod12(LETTER_PITCH_CLASS[letter] + offset);
}

// Writes the note on `letter` that sounds as `pitchClass`, e.g. ("E", 3) → "Eb".
export function spellOnLetter(letter, pitchClass) {
  let offset = mod12(pitchClass - LETTER_PITCH_CLASS[letter]);
  if (offset > 6) offset -= 12;
  if (Math.abs(offset) > 2) throw new Error(`Cannot spell pitch class ${pitchClass} on ${letter}.`);
  const accidental = offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset);
  return letter + accidental;
}

// Returns the letter `steps` letters above `letter`, e.g. ("A", 2) → "C".
export function letterAbove(letter, steps) {
  return LETTERS[(LETTERS.indexOf(letter) + steps) % 7];
}

// ─── Pitch and frequency ───

// Keeps any whole number inside 0–11.
export function mod12(value) {
  return ((value % 12) + 12) % 12;
}

// Converts a MIDI note number to a frequency in Hz (A4 = MIDI 69 = 440 Hz).
export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

// Names a MIDI note with its octave using sharps, e.g. 40 → "E2".
export function midiToNoteName(midi) {
  return `${SHARP_NAMES[mod12(midi)]}${Math.floor(midi / 12) - 1}`;
}

// ─── Guitar ───

// Open-string MIDI notes in standard tuning, low E to high e.
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64];

// String names from low E to high e.
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// Returns the MIDI note played on `stringIndex` (0 = low E) at `fret`.
export function fretToMidi(stringIndex, fret) {
  return STANDARD_TUNING[stringIndex] + fret;
}

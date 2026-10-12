// Tests for the shared theory engine: note spelling, intervals, scales and chord formulas.

import { describe, it, expect } from 'vitest';
import {
  noteNameToPitchClass,
  spellOnLetter,
  midiToFrequency,
  midiToNoteName,
  fretToMidi,
} from '../src/theory/notes.js';
import { spellInterval, intervalSemitones } from '../src/theory/intervals.js';
import { scaleNotes, SCALES } from '../src/theory/scales.js';
import {
  CHORD_QUALITIES,
  allChords,
  chordSymbol,
  chordTones,
  parseChordSymbol,
  labelForPitchClass,
} from '../src/theory/chords.js';

// Returns just the spelled note names of a chord.
function notesOf(root, quality) {
  return chordTones(root, quality).map((tone) => tone.note);
}

// ─── Notes ───

describe('notes', () => {
  it('reads sharps, flats and doubles', () => {
    expect(noteNameToPitchClass('C')).toBe(0);
    expect(noteNameToPitchClass('Bb')).toBe(10);
    expect(noteNameToPitchClass('A#')).toBe(10);
    expect(noteNameToPitchClass('E#')).toBe(5);
    expect(noteNameToPitchClass('Cb')).toBe(11);
    expect(noteNameToPitchClass('F##')).toBe(7);
  });

  it('spells a pitch class on a given letter', () => {
    expect(spellOnLetter('E', 3)).toBe('Eb');
    expect(spellOnLetter('D', 3)).toBe('D#');
    expect(spellOnLetter('B', 9)).toBe('Bbb');
  });

  it('converts MIDI to frequency and names', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(57)).toBeCloseTo(220, 6);
    expect(midiToNoteName(40)).toBe('E2');
    expect(midiToNoteName(64)).toBe('E4');
  });

  it('maps frets in standard tuning', () => {
    expect(fretToMidi(0, 0)).toBe(40);
    expect(fretToMidi(1, 3)).toBe(48); // C3 on the A string
    expect(fretToMidi(5, 12)).toBe(76);
  });
});

// ─── Intervals ───

describe('intervals', () => {
  it('spells intervals with the right letter', () => {
    expect(spellInterval('C', 'b3')).toBe('Eb');
    expect(spellInterval('Bb', '3')).toBe('D');
    expect(spellInterval('F#', '3')).toBe('A#');
    expect(spellInterval('Db', 'b7')).toBe('Cb');
    expect(spellInterval('C', '#5')).toBe('G#');
    expect(spellInterval('C', '9')).toBe('D');
  });

  it('knows interval sizes', () => {
    expect(intervalSemitones('b7')).toBe(10);
    expect(intervalSemitones('9')).toBe(14);
    expect(() => intervalSemitones('x')).toThrow();
  });
});

// ─── Scales ───

describe('scales', () => {
  it('spells common scales correctly', () => {
    expect(scaleNotes('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(scaleNotes('F', 'major')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
    expect(scaleNotes('A', 'natural-minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(scaleNotes('E', 'minor-pentatonic')).toEqual(['E', 'G', 'A', 'B', 'D']);
    expect(scaleNotes('A', 'blues')).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
    expect(scaleNotes('D', 'dorian')).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
  });

  it('uses each letter once in every 7-note scale on every major root', () => {
    for (const root of ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db']) {
      for (const [scaleId, scale] of Object.entries(SCALES)) {
        if (scale.degrees.length !== 7) continue;
        const letters = scaleNotes(root, scaleId).map((note) => note[0]);
        expect(new Set(letters).size, `${root} ${scaleId}`).toBe(7);
      }
    }
  });
});

// ─── Chords ───

describe('chord formulas', () => {
  it('spells chords for the key', () => {
    expect(notesOf('C', 'major')).toEqual(['C', 'E', 'G']);
    expect(notesOf('F', 'major')).toEqual(['F', 'A', 'C']);
    expect(notesOf('Bb', 'major')).toEqual(['Bb', 'D', 'F']);
    expect(notesOf('F#', 'minor')).toEqual(['F#', 'A', 'C#']);
    expect(notesOf('Eb', 'minor')).toEqual(['Eb', 'Gb', 'Bb']);
    expect(notesOf('G', 'dominant7')).toEqual(['G', 'B', 'D', 'F']);
    expect(notesOf('C', 'dominant7')).toEqual(['C', 'E', 'G', 'Bb']);
    expect(notesOf('C', 'diminished')).toEqual(['C', 'Eb', 'Gb']);
    expect(notesOf('C', 'augmented')).toEqual(['C', 'E', 'G#']);
    expect(notesOf('B', 'half-diminished')).toEqual(['B', 'D', 'F', 'A']);
    expect(notesOf('C', 'add9')).toEqual(['C', 'E', 'G', 'D']);
  });

  it('builds 12 roots × 12 qualities', () => {
    expect(allChords()).toHaveLength(12 * Object.keys(CHORD_QUALITIES).length);
  });

  it('uses flat names for flat keys and sharp names for sharp minor keys', () => {
    const symbols = allChords().map((chord) => chord.symbol);
    expect(symbols).toContain('Bb');
    expect(symbols).toContain('Db');
    expect(symbols).toContain('C#m');
    expect(symbols).toContain('G#m');
    expect(symbols).not.toContain('A#');
    expect(symbols).not.toContain('Dbm');
  });

  it('matches the semitone formulas in plan section 5.2', () => {
    const formulas = {
      'major': [0, 4, 7], 'minor': [0, 3, 7], 'power': [0, 7], 'dominant7': [0, 4, 7, 10],
      'major7': [0, 4, 7, 11], 'minor7': [0, 3, 7, 10], 'sus2': [0, 2, 7], 'sus4': [0, 5, 7],
      'add9': [0, 4, 7, 2], 'diminished': [0, 3, 6], 'augmented': [0, 4, 8], 'half-diminished': [0, 3, 6, 10],
    };
    for (const chord of allChords()) {
      const tones = chordTones(chord.root, chord.quality);
      const rootPitchClass = tones[0].pitchClass;
      const steps = tones.map((tone) => (tone.pitchClass - rootPitchClass + 12) % 12);
      expect(steps, chord.symbol).toEqual(formulas[chord.quality]);
    }
  });

  it('gives every chord tone its own letter (no A# next to Bb)', () => {
    for (const chord of allChords()) {
      const letters = chordTones(chord.root, chord.quality).map((tone) => tone.note[0]);
      expect(new Set(letters).size, chord.symbol).toBe(letters.length);
    }
  });

  it('only requires tones the chord contains', () => {
    for (const quality of Object.values(CHORD_QUALITIES)) {
      for (const label of quality.required) expect(quality.tones).toContain(label);
    }
  });

  it('reads and writes chord symbols, including slash chords', () => {
    for (const chord of allChords()) {
      const parsed = parseChordSymbol(chord.symbol);
      expect(chordSymbol(parsed.root, parsed.quality)).toBe(chord.symbol);
    }
    expect(parseChordSymbol('C/E')).toEqual({ root: 'C', quality: 'major', bass: 'E' });
    expect(chordSymbol('C', 'major', 'E')).toBe('C/E');
    expect(() => parseChordSymbol('Cxyz')).toThrow();
  });

  it('labels fretboard notes by their role in the chord', () => {
    expect(labelForPitchClass('C', 'dominant7', 10)).toBe('b7');
    expect(labelForPitchClass('C', 'major', 1)).toBeNull();
  });
});

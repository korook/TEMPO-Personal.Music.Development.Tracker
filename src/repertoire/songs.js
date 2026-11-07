// Song data helpers (TEMPO_UPDATE_REPERTOIRE.md 4.1): read a part's `bars` string, work out
// a song's chord set (never typed in by hand), compare chords by sound rather than spelling,
// transpose for the capo finder, and find every song (pool files + Baranay's own + songs
// added in the app).

import { ROCK_ESSENTIALS } from '../data/songs/rock-essentials.js';
import { TURKISH_ROCK } from '../data/songs/turkish-rock.js';
import { BARANAY_SONGS } from '../data/songs/baranay.js';
import { parseChordSymbol, getQuality, chordSymbol, labelForPitchClass } from '../theory/chords.js';
import { spellInterval } from '../theory/intervals.js';
import { noteNameToPitchClass, preferredRootName, mod12 } from '../theory/notes.js';

// ─── The song lists ───

// The suggestion pool, one entry per file, so a new genre is one new file.
export const SONG_SETS = [
  { id: 'rock', label: 'Rock essentials', songs: ROCK_ESSENTIALS },
  { id: 'turkish', label: 'Türkçe rock', songs: TURKISH_ROCK },
];

// Every pool song, tagged with the set it comes from.
export const POOL_SONGS = SONG_SETS.flatMap((set) => set.songs.map((song) => ({ ...song, set: set.id })));

// Every song that ships with the app (pool + Baranay's own).
export const BUILT_IN_SONGS = [...BARANAY_SONGS.map((song) => ({ ...song, set: 'own' })), ...POOL_SONGS];

// Finds a song by id: built-in first, then songs added in the app (state.repertoire.custom).
export function findSong(id, state = null) {
  const builtIn = BUILT_IN_SONGS.find((song) => song.id === id);
  if (builtIn) return builtIn;
  const custom = state && state.repertoire && state.repertoire.custom[id];
  return custom ? { ...custom, set: 'custom' } : null;
}

// ─── Bars and chords ───

// Splits a `bars` string into bars of chord names: "Am | F G" → [["Am"], ["F", "G"]].
// Two chords in a bar split it evenly.
export function parseBars(bars) {
  if (!bars || !bars.trim()) return [];
  return bars.split('|').map((bar) => bar.trim().split(/\s+/).filter(Boolean));
}

// Returns the chord names in a bars string that the chord engine can't read.
export function unknownChords(bars) {
  return parseBars(bars).flat().filter((name) => {
    try {
      parseChordSymbol(name);
      return false;
    } catch {
      return true;
    }
  });
}

// The song's chord set: every chord used across its parts, once each, in order of first use.
export function songChords(song) {
  const seen = new Set();
  const chords = [];
  for (const part of song.parts || []) {
    for (const name of parseBars(part.bars).flat()) {
      const key = chordKey(name);
      if (key && !seen.has(key)) {
        seen.add(key);
        chords.push(name);
      }
    }
  }
  return chords;
}

// A chord's identity by sound: root pitch class + quality, ignoring the bass note and spelling.
// "D/F#" and "D" are the same shape family; "A#m" and "Bbm" are the same chord. Null if unreadable.
export function chordKey(name) {
  try {
    const { root, quality } = parseChordSymbol(name);
    return `${noteNameToPitchClass(root)}:${quality}`;
  } catch {
    return null;
  }
}

// The plain chord (no bass note) for a chord name: "D/F#" → "D". Used for library links.
export function baseChord(name) {
  const { root, quality } = parseChordSymbol(name);
  return chordSymbol(root, quality);
}

// ─── Transposing ───

// Moves a chord by `semitones` and spells the new root the usual way: ("Bb", -3) → "G".
export function transposeChord(name, semitones) {
  const { root, quality, bass } = parseChordSymbol(name);
  const minorFamily = getQuality(quality).minorFamily;
  const newRoot = preferredRootName(mod12(noteNameToPitchClass(root) + semitones), minorFamily);
  return chordSymbol(newRoot, quality, bass ? spellBass(newRoot, quality, mod12(noteNameToPitchClass(bass) + semitones)) : null);
}

// Spells a bass note: as the chord's own tone when it is one (E/G#, not E/Ab), else the usual way.
function spellBass(rootName, quality, pitchClass) {
  const label = labelForPitchClass(rootName, quality, pitchClass);
  return label ? spellInterval(rootName, label) : preferredRootName(pitchClass, false);
}

// The shapes you play with a capo on `fret`: every chord moves down by that many semitones.
// (Bb Eb F with capo 3 → G C D.)
export function shapesWithCapo(chords, fret) {
  return chords.map((name) => transposeChord(name, -fret));
}

// Shared pieces for the ear games: random helpers that tests can make repeatable,
// the interval table and the song anchors for intervals.

// ─── Randomness ───

// Returns a repeatable random function for a seed (used by tests), or Math.random.
export function makeRandom(seed = null) {
  if (seed === null) return Math.random;
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks one item from a list.
export function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

// Returns a whole number from min to max (both included).
export function randomInt(min, max, random) {
  return min + Math.floor(random() * (max - min + 1));
}

// ─── Intervals ───

// Every interval up to an octave: size in semitones and its name.
export const INTERVALS = {
  m2: { semitones: 1, name: 'minor 2nd' },
  M2: { semitones: 2, name: 'major 2nd' },
  m3: { semitones: 3, name: 'minor 3rd' },
  M3: { semitones: 4, name: 'major 3rd' },
  P4: { semitones: 5, name: 'perfect 4th' },
  TT: { semitones: 6, name: 'tritone' },
  P5: { semitones: 7, name: 'perfect 5th' },
  m6: { semitones: 8, name: 'minor 6th' },
  M6: { semitones: 9, name: 'major 6th' },
  m7: { semitones: 10, name: 'minor 7th' },
  M7: { semitones: 11, name: 'major 7th' },
  P8: { semitones: 12, name: 'octave' },
};

// Song openings that start with each interval going up, as memory hooks. They fade out
// as your accuracy grows. (Well-known teaching anchors; Baranay may swap in his own.)
export const SONG_ANCHORS = {
  m2: 'Jaws theme',
  M2: 'Happy Birthday',
  m3: 'Greensleeves',
  M3: 'When the Saints Go Marching In',
  P4: 'Here Comes the Bride',
  TT: 'The Simpsons theme',
  P5: 'Star Wars main theme',
  m6: 'The Entertainer (first leap)',
  M6: 'My Bonnie Lies Over the Ocean',
  m7: 'Somewhere (West Side Story)',
  M7: 'Take On Me (chorus leap)',
  P8: 'Somewhere Over the Rainbow',
};

// The major scale as semitones from the root.
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

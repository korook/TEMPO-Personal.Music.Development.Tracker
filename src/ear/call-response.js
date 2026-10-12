// Ear game 6: call and response (like Theta's Parrot Phrases). Hear a short phrase from
// the major pentatonic, then play it back on the on-screen fretboard (first five frets).
// Phrases get longer and faster with each level.

import { pick, randomInt } from './common.js';
import { STANDARD_TUNING, mod12 } from '../theory/notes.js';

// Phrase length and note spacing (seconds) per level.
const LEVELS = [
  { length: 3, gap: 0.55 },
  { length: 4, gap: 0.5 },
  { length: 4, gap: 0.36 },
  { length: 5, gap: 0.32 },
];

// Keys that sit well in the first five frets.
const KEYS = [0, 2, 4, 7, 9];
const PENTATONIC = [0, 2, 4, 7, 9];
export const INPUT_FRETS = 5;

export const callResponse = {
  id: 'call-response',
  title: 'Call and response',
  blurb: 'Hear a short phrase, play it back on the fretboard.',
  levels: LEVELS.length,

  // Builds one question: the phrase as MIDI notes, answered by tapping the fretboard.
  makeQuestion(level, random) {
    const { length, gap } = LEVELS[level - 1];
    const key = pick(KEYS, random);
    const notes = playableScaleNotes(key);
    const tonicIndex = notes.findIndex((midi) => mod12(midi) === key && midi >= 52);
    let index = tonicIndex >= 0 ? tonicIndex : Math.floor(notes.length / 2);
    const phrase = [notes[index]];
    while (phrase.length < length) {
      const step = pick([-2, -1, 1, 2], random);
      index = Math.max(0, Math.min(notes.length - 1, index + step));
      if (notes[index] !== phrase[phrase.length - 1] || randomInt(0, 3, random) === 0) phrase.push(notes[index]);
    }
    return {
      exercise: this.id,
      level,
      key: `phrase-${length}`,
      kind: 'fretboard',
      prompt: `Play the ${length} notes back on the fretboard below.`,
      answer: phrase,
      sound: { type: 'notes', events: phrase.map((midi, position) => ({ midis: [midi], at: position * gap, duration: gap + 0.3 })) },
      explain: 'The phrase used the major pentatonic scale.',
    };
  },
};

// Every pentatonic note you can play in the first five frets, low to high, without repeats.
export function playableScaleNotes(key) {
  const notes = new Set();
  STANDARD_TUNING.forEach((open) => {
    for (let fret = 0; fret <= INPUT_FRETS; fret++) {
      const midi = open + fret;
      if (PENTATONIC.includes(mod12(midi - key))) notes.add(midi);
    }
  });
  return [...notes].sort((a, b) => a - b);
}

// True if the played notes match the phrase exactly (same pitches, same order).
export function phraseMatches(phrase, played) {
  return phrase.length === played.length && phrase.every((midi, index) => midi === played[index]);
}

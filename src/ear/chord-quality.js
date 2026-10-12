// Ear game 4: chord quality (like Theta's Flash Chords). A chord is strummed, then picked
// note by note; name its type. Shapes come from the chord engine.

import { pick, randomInt } from './common.js';
import { thumbnailVoicing } from '../chords/library.js';
import { rootNameFor, chordSymbol } from '../theory/chords.js';
import { fretToMidi } from '../theory/notes.js';

// Types added level by level.
export const QUALITY_LEVELS = [
  ['major', 'minor'],
  ['major', 'minor', 'dominant7'],
  ['major', 'minor', 'dominant7', 'major7'],
  ['major', 'minor', 'dominant7', 'major7', 'minor7'],
];

// How each type is named on the answer keys.
const QUALITY_LABELS = { major: 'major', minor: 'minor', dominant7: '7 (dominant)', major7: 'maj7', minor7: 'm7' };

export const chordQuality = {
  id: 'chord-quality',
  title: 'Chord quality',
  blurb: 'Major, minor, 7, maj7 or m7?',
  levels: QUALITY_LEVELS.length,

  // Builds one question; `pool` limits the answers (confusion duels).
  makeQuestion(level, random, { pool = null } = {}) {
    const qualities = pool || QUALITY_LEVELS[level - 1];
    const quality = pick(qualities, random);
    const root = rootNameFor(randomInt(0, 11, random), quality);
    const voicing = thumbnailVoicing(root, quality);
    const midis = voicing.frets.map((fret, string) => (fret === null ? null : fretToMidi(string, fret))).filter((midi) => midi !== null);
    const strum = midis.map((midi, index) => ({ midis: [midi], at: index * 0.03, duration: 1.6, volume: 0.4 }));
    const arpeggio = midis.map((midi, index) => ({ midis: [midi], at: 2 + index * 0.28, duration: 0.9, volume: 0.45 }));
    return {
      exercise: this.id,
      level,
      key: quality,
      kind: 'choice',
      prompt: 'What type of chord is it?',
      options: qualities.map((value) => ({ value, label: QUALITY_LABELS[value] })),
      answer: quality,
      sound: { type: 'notes', events: [...strum, ...arpeggio] },
      reveal: { chord: { root, quality, voicing } },
      explain: `${chordSymbol(root, quality)}: a ${QUALITY_LABELS[quality]} chord.`,
    };
  },
};

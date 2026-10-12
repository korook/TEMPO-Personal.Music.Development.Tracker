// Ear game 5: progression detective (like ToneGym's Route VI). Four chords in a random key;
// which common progression is it? Several match the practice drills.

import { pick, randomInt } from './common.js';
import { rootNameFor, chordSymbol } from '../theory/chords.js';

// Progressions as steps above the key note, with their Roman numerals.
export const EAR_PROGRESSIONS = [
  { id: 'I-IV-V-I', label: 'I – IV – V – I', chords: [[0, 'major'], [5, 'major'], [7, 'major'], [0, 'major']] },
  { id: 'I-V-vi-IV', label: 'I – V – vi – IV', chords: [[0, 'major'], [7, 'major'], [9, 'minor'], [5, 'major']] },
  { id: 'vi-IV-I-V', label: 'vi – IV – I – V', chords: [[9, 'minor'], [5, 'major'], [0, 'major'], [7, 'major']] },
  { id: 'I-vi-IV-V', label: 'I – vi – IV – V', chords: [[0, 'major'], [9, 'minor'], [5, 'major'], [7, 'major']] },
  { id: 'ii-V-I-I', label: 'ii – V – I', chords: [[2, 'minor'], [7, 'major'], [0, 'major'], [0, 'major']] },
  { id: 'I-bVII-IV-I', label: 'I – ♭VII – IV – I', chords: [[0, 'major'], [10, 'major'], [5, 'major'], [0, 'major']] },
];

// How many progressions are in play at each level.
const LEVEL_SIZES = [2, 3, 4, 6];

export const progressionDetective = {
  id: 'progressions',
  title: 'Progression detective',
  blurb: 'Four chords: which progression is it?',
  levels: LEVEL_SIZES.length,

  // Builds one question; `pool` limits the answers (confusion duels).
  makeQuestion(level, random, { pool = null } = {}) {
    const choices = pool ? EAR_PROGRESSIONS.filter((progression) => pool.includes(progression.id)) : EAR_PROGRESSIONS.slice(0, LEVEL_SIZES[level - 1]);
    const progression = pick(choices, random);
    const keyNote = randomInt(48, 55, random);
    const names = progression.chords.map(([step, quality]) => chordSymbol(rootNameFor((keyNote + step) % 12, quality), quality));
    return {
      exercise: this.id,
      level,
      key: progression.id,
      kind: 'choice',
      prompt: 'Which progression is it?',
      options: choices.map((choice) => ({ value: choice.id, label: choice.label })),
      answer: progression.id,
      sound: {
        type: 'notes',
        events: progression.chords.map(([step, quality], index) => ({ midis: triad(keyNote + step, quality), at: index * 1.05, duration: 1, volume: 0.35 })),
      },
      explain: `${progression.label}: here ${names.join(' – ')}.`,
    };
  },
};

// A close triad with the root in the bass.
function triad(root, quality) {
  const third = quality === 'minor' ? 3 : 4;
  const bass = root > 52 ? root - 12 : root;
  return [bass, bass + 12, bass + 12 + third, bass + 19];
}

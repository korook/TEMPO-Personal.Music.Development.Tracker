// Ear game 1: scale degrees in context (like Functional Ear Trainer). A cadence sets the
// key, then one note plays; name its degree (1–7). After the answer the note walks home
// to the tonic, so you hear where it wants to go.

import { MAJOR_SCALE, pick, randomInt } from './common.js';

// Degrees available at each level.
const LEVEL_DEGREES = [[1, 3, 5], [1, 2, 3, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6, 7]];

export const scaleDegrees = {
  id: 'scale-degrees',
  title: 'Scale degrees',
  blurb: 'Hear the key, then name the note: 1 to 7.',
  levels: LEVEL_DEGREES.length,

  // Builds one question. `pool` limits the answers (used by confusion duels).
  makeQuestion(level, random, { pool = null } = {}) {
    const degrees = pool ? pool.map(Number) : LEVEL_DEGREES[level - 1];
    const degree = pick(degrees, random);
    const tonic = randomInt(55, 66, random);
    const target = tonic + MAJOR_SCALE[degree - 1];
    return {
      exercise: this.id,
      level,
      key: String(degree),
      kind: 'choice',
      prompt: 'Which degree of the scale is the last note?',
      options: degrees.map((value) => ({ value: String(value), label: String(value) })),
      answer: String(degree),
      sound: { type: 'notes', events: [...cadence(tonic), { midis: [target], at: 3.3, duration: 1.4 }] },
      after: { type: 'notes', events: walkHome(tonic, degree) },
      explain: `That was degree ${degree}.`,
    };
  },
};

// I – IV – V – I in close position, with the bass an octave below.
export function cadence(tonic) {
  const chords = [
    [tonic - 12, tonic, tonic + 4, tonic + 7],
    [tonic - 7, tonic, tonic + 5, tonic + 9],
    [tonic - 5, tonic - 1, tonic + 2, tonic + 7],
    [tonic - 12, tonic, tonic + 4, tonic + 7],
  ];
  return chords.map((midis, index) => ({ midis, at: index * 0.75, duration: index === 3 ? 1.1 : 0.7, volume: 0.35 }));
}

// The note stepping home: down to 1 from degrees 2–4, up to the octave from 5–7.
export function walkHome(tonic, degree) {
  const steps = [];
  if (degree <= 4) {
    for (let current = degree; current >= 1; current--) steps.push(tonic + MAJOR_SCALE[current - 1]);
  } else {
    for (let current = degree; current <= 7; current++) steps.push(tonic + MAJOR_SCALE[current - 1]);
    steps.push(tonic + 12);
  }
  return steps.map((midi, index) => ({ midis: [midi], at: index * 0.35, duration: 0.5 }));
}

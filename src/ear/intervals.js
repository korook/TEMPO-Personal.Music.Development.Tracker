// Ear game 2: intervals (like Complete Ear Trainer). Two notes going up; name the gap.
// Levels start with two very different intervals and add closer ones.

import { INTERVALS, pick, randomInt } from './common.js';

// The intervals available at each level.
export const INTERVAL_LEVELS = [
  ['M2', 'P5'],
  ['M2', 'P5', 'P8'],
  ['M2', 'm3', 'M3', 'P5', 'P8'],
  ['M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'P8'],
  Object.keys(INTERVALS),
];

export const intervals = {
  id: 'intervals',
  title: 'Intervals',
  blurb: 'Two notes going up: name the gap.',
  levels: INTERVAL_LEVELS.length,

  // Builds one question; `pool` limits the answers (confusion duels).
  makeQuestion(level, random, { pool = null } = {}) {
    const names = pool || INTERVAL_LEVELS[level - 1];
    const name = pick(names, random);
    const root = randomInt(50, 62, random);
    const top = root + INTERVALS[name].semitones;
    return {
      exercise: this.id,
      level,
      key: name,
      kind: 'choice',
      prompt: 'How far apart are the two notes?',
      options: orderBySize(names).map((value) => ({ value, label: `${value} · ${INTERVALS[value].name}` })),
      answer: name,
      sound: { type: 'notes', events: [{ midis: [root], at: 0, duration: 0.9 }, { midis: [top], at: 0.9, duration: 1.3 }] },
      reveal: { notes: [{ midi: root, label: 'R' }, { midi: top, label: name }] },
      explain: `${name}: a ${INTERVALS[name].name}, ${INTERVALS[name].semitones} semitone${INTERVALS[name].semitones === 1 ? '' : 's'}.`,
    };
  },
};

// Sorts interval names from smallest to largest.
export function orderBySize(names) {
  return [...names].sort((a, b) => INTERVALS[a].semitones - INTERVALS[b].semitones);
}

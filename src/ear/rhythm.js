// Ear game 7: rhythm tap-back (like EarMaster). Hear a one-bar rhythm after a count-in,
// then tap it back with Space or the tap key. Each hit gets: early, on time or late.

import { pick } from './common.js';

const BPM = 80;
const EIGHTH = 60 / BPM / 2;
const ON_TIME = 0.05;
const TOLERANCE = 0.12;

// Rhythms on an eighth-note grid (0–7 in a 4/4 bar), getting busier with each level.
const LEVEL_PATTERNS = [
  [[0, 2, 4, 6], [0, 4, 6], [0, 2, 6], [0, 2, 4]],
  [[0, 2, 3, 4, 6], [0, 1, 2, 4, 6], [0, 2, 4, 5, 6], [0, 2, 4, 6, 7]],
  [[0, 3, 4, 6], [0, 2, 3, 5, 6], [0, 3, 6, 7], [1, 2, 4, 7]],
];

export const rhythmTapBack = {
  id: 'rhythm',
  title: 'Rhythm tap-back',
  blurb: 'Hear a bar, then tap it back in time.',
  levels: LEVEL_PATTERNS.length,

  // Builds one question: the onsets in seconds from the start of the bar.
  makeQuestion(level, random) {
    const pattern = pick(LEVEL_PATTERNS[level - 1], random);
    return {
      exercise: this.id,
      level,
      key: pattern.join(''),
      kind: 'tap',
      prompt: 'Listen, then tap the same rhythm after the four count-in clicks.',
      answer: pattern.map((eighth) => eighth * EIGHTH),
      sound: { type: 'rhythm', bpm: BPM, onsets: pattern },
      explain: `The rhythm on eighth notes: ${pattern.map((eighth) => (eighth % 2 ? '&' : eighth / 2 + 1)).join(' ')}.`,
    };
  },
};

// The length of one beat in seconds.
export const BEAT_SECONDS = 60 / BPM;

// Compares taps to the expected onsets (both in seconds from the start of the bar).
// Each onset takes the nearest unused tap within the tolerance. Returns
// { hits: [{ expected, offset, verdict }], extra, correct }.
export function evaluateTaps(expected, taps) {
  const unused = [...taps];
  const hits = expected.map((time) => {
    let best = -1;
    unused.forEach((tap, index) => {
      if (Math.abs(tap - time) <= TOLERANCE && (best < 0 || Math.abs(tap - time) < Math.abs(unused[best] - time))) best = index;
    });
    if (best < 0) return { expected: time, offset: null, verdict: 'missed' };
    const offset = unused[best] - time;
    unused.splice(best, 1);
    const verdict = Math.abs(offset) <= ON_TIME ? 'on time' : offset < 0 ? 'early' : 'late';
    return { expected: time, offset, verdict };
  });
  const correct = unused.length === 0 && hits.every((hit) => hit.verdict !== 'missed');
  return { hits, extra: unused.length, correct };
}

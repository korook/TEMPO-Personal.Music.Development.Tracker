// Ear game 3: play it back (like Perfect Ear). Hear an interval, find it on your guitar,
// then reveal where it sits on the fretboard and say honestly whether you found it.

import { intervals, INTERVAL_LEVELS } from './intervals.js';

export const playBack = {
  id: 'play-back',
  title: 'Play it back',
  blurb: 'Hear it, find it on the guitar, then check on the neck.',
  levels: INTERVAL_LEVELS.length,

  // Builds one question from the interval game, answered by self-check after the reveal.
  makeQuestion(level, random, options = {}) {
    const question = intervals.makeQuestion(level, random, options);
    return {
      ...question,
      exercise: this.id,
      kind: 'self',
      prompt: 'Find these two notes on your guitar. Then show where they are and check yourself.',
      options: [{ value: 'yes', label: 'Found it' }, { value: 'no', label: 'Not yet' }],
      answer: 'yes',
    };
  },
};

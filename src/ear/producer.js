// Ear game 8: producer's ear (like SoundGym and TrainYourEars). A short loop plays with one
// frequency band boosted; which band is it? Flip to the flat loop to compare.

import { pick } from './common.js';

export const BANDS = [125, 250, 500, 1000, 2000, 4000, 8000];

// Bands in play per level: far apart first, then all seven.
const LEVEL_BANDS = [[250, 4000], [125, 1000, 8000], [125, 500, 2000, 8000], BANDS];

export const producerEar = {
  id: 'producer',
  title: "Producer's ear",
  blurb: 'Which frequency band is boosted?',
  levels: LEVEL_BANDS.length,

  // Builds one question; `pool` limits the answers (confusion duels).
  makeQuestion(level, random, { pool = null } = {}) {
    const bands = pool ? pool.map(Number) : LEVEL_BANDS[level - 1];
    const band = pick(bands, random);
    return {
      exercise: this.id,
      level,
      key: String(band),
      kind: 'choice',
      prompt: 'Which band is boosted? Use "Hear it flat" to compare.',
      options: bands.map((value) => ({ value: String(value), label: bandLabel(value) })),
      answer: String(band),
      sound: { type: 'mix', boostHz: band },
      explain: `The boost was at ${bandLabel(band)}.`,
    };
  },
};

// "125 Hz", "1 kHz", "8 kHz".
export function bandLabel(hertz) {
  return hertz >= 1000 ? `${hertz / 1000} kHz` : `${hertz} Hz`;
}

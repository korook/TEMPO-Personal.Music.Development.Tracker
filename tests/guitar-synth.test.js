// Tests for the Karplus-Strong guitar sound and the strum plan.

import { describe, it, expect } from 'vitest';
import { karplusStrong, planStrum } from '../src/audio/guitar-synth.js';
import { midiToFrequency } from '../src/theory/notes.js';

const SAMPLE_RATE = 44100;

// A repeatable random number generator so the sound is the same every run.
function seededRandom(seed = 42) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

// Returns the loudness (root mean square) of a slice of samples.
function loudness(samples, from, to) {
  let sum = 0;
  for (let index = from; index < to; index++) sum += samples[index] ** 2;
  return Math.sqrt(sum / (to - from));
}

// Finds the repeating period in samples (to a fraction of a sample) by checking which
// lag lines up best with itself, then refining the peak with a parabola.
function measurePeriod(samples, minLag, maxLag) {
  const start = 2000;
  const length = 6000;
  const scoreAt = (lag) => {
    let score = 0;
    for (let index = start; index < start + length; index++) score += samples[index] * samples[index + lag];
    return score;
  };
  let bestLag = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) if (scoreAt(lag) > scoreAt(bestLag)) bestLag = lag;
  const [left, middle, right] = [scoreAt(bestLag - 1), scoreAt(bestLag), scoreAt(bestLag + 1)];
  return bestLag + (0.5 * (left - right)) / (left - 2 * middle + right);
}

// ─── Sound ───

describe('karplusStrong', () => {
  it('makes a note of the right length with safe levels', () => {
    const samples = karplusStrong(110, { sampleRate: SAMPLE_RATE, seconds: 2, random: seededRandom() });
    expect(samples).toHaveLength(2 * SAMPLE_RATE);
    expect(samples.every((value) => Number.isFinite(value) && Math.abs(value) <= 0.9 + 1e-6)).toBe(true);
  });

  it('fades out like a plucked string', () => {
    const samples = karplusStrong(196, { sampleRate: SAMPLE_RATE, seconds: 3, random: seededRandom() });
    const early = loudness(samples, 0, 4410);
    const late = loudness(samples, 2 * SAMPLE_RATE, 2 * SAMPLE_RATE + 4410);
    expect(late).toBeLessThan(early * 0.5);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(1e-3);
  });

  it('plays in tune across the neck (within 5 cents)', () => {
    for (const midi of [40, 45, 50, 55, 59, 64, 69, 76, 79]) {
      const frequency = midiToFrequency(midi);
      const samples = karplusStrong(frequency, { sampleRate: SAMPLE_RATE, seconds: 1, random: seededRandom(midi) });
      const expected = SAMPLE_RATE / frequency;
      const period = measurePeriod(samples, Math.floor(expected * 0.9), Math.ceil(expected * 1.1));
      const cents = 1200 * Math.log2(period / expected);
      expect(Math.abs(cents), `MIDI ${midi}`).toBeLessThan(5);
    }
  });
});

// ─── Strumming ───

describe('planStrum', () => {
  it('strums open C down from the A string, skipping the muted low E', () => {
    const plan = planStrum(['x', 3, 2, 0, 1, 0], { direction: 'down', speedMs: 20 });
    expect(plan.map((note) => note.stringIndex)).toEqual([1, 2, 3, 4, 5]);
    expect(plan.map((note) => note.midi)).toEqual([48, 52, 55, 60, 64]); // C E G C E
    expect(plan.map((note) => note.offsetSeconds)).toEqual([0, 0.02, 0.04, 0.06, 0.08]);
  });

  it('strums up from the high string', () => {
    const plan = planStrum([3, 2, 0, 0, 0, 3], { direction: 'up', speedMs: 10 });
    expect(plan.map((note) => note.stringIndex)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(plan[0].offsetSeconds).toBe(0);
  });

  it('ignores strings marked null or x', () => {
    expect(planStrum([null, 'x', 0, 2, 3, 2])).toHaveLength(4);
  });
});

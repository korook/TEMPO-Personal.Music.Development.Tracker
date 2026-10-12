// Tests for the metronome's timing core, run on a fake clock with an uneven timer.
// The key check: over 5 minutes every click lands exactly on the beat grid, none late,
// none missing and none doubled.

import { describe, it, expect } from 'vitest';
import { createMetronome, createTapTempo } from '../src/audio/metronome.js';

// Builds a metronome on a fake clock. `run(seconds)` moves time forward in uneven steps
// (8–60 ms, like a busy browser) and lets the metronome's timer fire at each step.
function createTestRig({ seed = 1 } = {}) {
  let clock = 0;
  let tickCallback = null;
  let random = seed;
  const clicks = [];
  const pulses = [];

  // A small repeatable random number generator, so test runs are identical.
  function nextRandom() {
    random = (random * 16807) % 2147483647;
    return random / 2147483647;
  }

  const metronome = createMetronome({
    now: () => clock,
    playClick: (time, kind) => clicks.push({ time, kind }),
    timer: { start: (callback) => { tickCallback = callback; }, stop: () => { tickCallback = null; } },
    onPulse: (pulse) => pulses.push(pulse),
  });

  // Moves the fake clock forward by `seconds`, firing the timer at uneven gaps.
  function run(seconds) {
    const end = clock + seconds;
    while (clock < end) {
      clock = Math.min(end, clock + 0.008 + nextRandom() * 0.052);
      if (tickCallback) tickCallback();
    }
  }

  // Moves the fake clock forward with no timer ticks at all (a frozen or sleeping page).
  function freeze(seconds) {
    clock += seconds;
  }

  return { metronome, clicks, pulses, run, freeze, now: () => clock };
}

// ─── Staying in time ───

describe('timing over 5 minutes', () => {
  for (const bpm of [30, 60, 120, 240]) {
    it(`stays on the grid at ${bpm} BPM`, () => {
      const rig = createTestRig({ seed: bpm });
      rig.metronome.setBpm(bpm);
      rig.metronome.start();
      rig.run(300);

      const beatSeconds = 60 / bpm;
      const firstTime = rig.clicks[0].time;
      const expectedCount = Math.floor((rig.now() + 0.1 - firstTime) / beatSeconds) + 1;
      expect(Math.abs(rig.clicks.length - expectedCount)).toBeLessThanOrEqual(1);

      let worstError = 0;
      rig.clicks.forEach((click, index) => {
        worstError = Math.max(worstError, Math.abs(click.time - (firstTime + index * beatSeconds)));
      });
      expect(worstError).toBeLessThan(1e-9);
      expect(rig.metronome.getStats().latePulses).toBe(0);
    });
  }

  it('books every click ahead of time, never in the past', () => {
    const rig = createTestRig({ seed: 7 });
    rig.metronome.setBpm(200);
    rig.metronome.setSubdivision(4);
    rig.metronome.start();
    rig.run(300);
    expect(rig.metronome.getStats().latePulses).toBe(0);
    expect(rig.clicks).toHaveLength(rig.metronome.getStats().pulses);
  });
});

// ─── Tempo changes ───

describe('tempo changes', () => {
  it('switches tempo with no gap and no double click', () => {
    const rig = createTestRig();
    rig.metronome.setBpm(60);
    rig.metronome.start();
    rig.run(10);
    rig.metronome.setBpm(120);
    rig.run(10);

    const gaps = rig.clicks.slice(1).map((click, index) => click.time - rig.clicks[index].time);
    gaps.forEach((gap) => {
      const isOldOrNew = Math.abs(gap - 1) < 1e-9 || Math.abs(gap - 0.5) < 1e-9;
      expect(isOldOrNew).toBe(true);
    });
    expect(gaps.filter((gap) => Math.abs(gap - 0.5) < 1e-9).length).toBeGreaterThan(15);
  });

  it('keeps BPM between 30 and 240', () => {
    const rig = createTestRig();
    rig.metronome.setBpm(10);
    expect(rig.metronome.getSettings().bpm).toBe(30);
    rig.metronome.setBpm(400);
    expect(rig.metronome.getSettings().bpm).toBe(240);
    rig.metronome.adjustBpm(-5);
    expect(rig.metronome.getSettings().bpm).toBe(235);
  });

  it('skips missed clicks after the page was frozen, then carries on in time', () => {
    const rig = createTestRig();
    rig.metronome.start();
    rig.run(2);
    const countBefore = rig.clicks.length;
    rig.freeze(5);
    rig.run(3);
    expect(rig.metronome.getStats().resyncs).toBe(1);
    expect(rig.metronome.getStats().latePulses).toBe(0);
    // About 3 more beats at 80 BPM, not a burst of the ~7 missed ones.
    expect(rig.clicks.length - countBefore).toBeLessThanOrEqual(5);
  });
});

// ─── Bars, accents and subdivisions ───

describe('bars and accents', () => {
  it('accents beat 1 of each 4/4 bar', () => {
    const rig = createTestRig();
    rig.metronome.start();
    rig.run(8);
    const kinds = rig.clicks.slice(0, 8).map((click) => click.kind);
    expect(kinds).toEqual(['accent', 'beat', 'beat', 'beat', 'accent', 'beat', 'beat', 'beat']);
  });

  it('counts 3/4 and 6/8 bars, with a lighter accent on beat 4 of 6/8', () => {
    const waltz = createTestRig();
    waltz.metronome.setTimeSignature('3/4');
    waltz.metronome.start();
    waltz.run(5);
    expect(waltz.clicks.slice(0, 6).map((click) => click.kind)).toEqual(['accent', 'beat', 'beat', 'accent', 'beat', 'beat']);

    const sixEight = createTestRig();
    sixEight.metronome.setTimeSignature('6/8');
    sixEight.metronome.start();
    sixEight.run(5);
    expect(sixEight.clicks.slice(0, 6).map((click) => click.kind)).toEqual(['accent', 'beat', 'beat', 'secondary', 'beat', 'beat']);
  });

  it('plays quiet subdivision clicks between beats', () => {
    const rig = createTestRig();
    rig.metronome.setBpm(60);
    rig.metronome.setSubdivision(2);
    rig.metronome.start();
    rig.run(4);
    expect(rig.clicks.slice(0, 4).map((click) => click.kind)).toEqual(['accent', 'sub', 'beat', 'sub']);
    expect(rig.clicks[1].time - rig.clicks[0].time).toBeCloseTo(0.5, 9);
  });

  it('turns the accent off', () => {
    const rig = createTestRig();
    rig.metronome.configure({ accent: false });
    rig.metronome.start();
    rig.run(3);
    expect(rig.clicks.every((click) => click.kind === 'beat')).toBe(true);
  });
});

// ─── Speed trainer ───

describe('speed trainer', () => {
  it('adds BPM every N bars and stops at the target', () => {
    const rig = createTestRig();
    rig.metronome.setBpm(60);
    rig.metronome.configure({ speedTrainer: { enabled: true, stepBpm: 10, everyBars: 2, targetBpm: 80 } });
    rig.metronome.start();
    rig.run(60);

    const tempoOfBar = (bar) => rig.pulses.find((pulse) => pulse.bar === bar).bpm;
    expect(tempoOfBar(0)).toBe(60);
    expect(tempoOfBar(1)).toBe(60);
    expect(tempoOfBar(2)).toBe(70);
    expect(tempoOfBar(4)).toBe(80);
    expect(tempoOfBar(6)).toBe(80);
    expect(rig.metronome.getStats().latePulses).toBe(0);
  });
});

// ─── Chord-change mode ───

describe('chord-change mode', () => {
  it('moves to the next chord every N beats and shows what comes next', () => {
    const rig = createTestRig();
    rig.metronome.setBpm(120);
    rig.metronome.configure({ chordChange: { enabled: true, chords: ['C', 'G', 'Am', 'F'], everyBeats: 2 } });
    rig.metronome.start();
    rig.run(6);

    const beats = rig.pulses.filter((pulse) => pulse.isBeat).slice(0, 9);
    expect(beats.map((pulse) => pulse.chord.current)).toEqual(['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'F', 'C']);
    expect(beats[1].chord.next).toBe('G');
    expect(beats.map((pulse) => pulse.chord.changesNow)).toEqual([true, false, true, false, true, false, true, false, true]);
  });
});

// ─── Tap tempo ───

describe('tap tempo', () => {
  it('turns steady taps into BPM', () => {
    const tapper = createTapTempo();
    expect(tapper.tap(0)).toBeNull();
    expect(tapper.tap(500)).toBe(120);
    expect(tapper.tap(1000)).toBe(120);
    expect(tapper.tap(1700)).toBe(106);
  });

  it('starts over after a long pause', () => {
    const tapper = createTapTempo();
    tapper.tap(0);
    tapper.tap(1000);
    expect(tapper.tap(5000)).toBeNull();
    expect(tapper.tap(5250)).toBe(240);
  });
});

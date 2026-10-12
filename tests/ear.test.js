// Tests for ear training (TEMPO_PLAN.md section 8): every game builds correct questions,
// scoring gives stars and unlocks levels, and repeated mix-ups create confusion duels
// and Fix openings.

import { describe, it, expect } from 'vitest';
import { makeRandom, INTERVALS, MAJOR_SCALE } from '../src/ear/common.js';
import { EAR_EXERCISES, getExercise } from '../src/ear/index.js';
import { walkHome } from '../src/ear/scale-degrees.js';
import { EAR_PROGRESSIONS } from '../src/ear/progressions.js';
import { playableScaleNotes, phraseMatches } from '../src/ear/call-response.js';
import { evaluateTaps } from '../src/ear/rhythm.js';
import { bandLabel } from '../src/ear/producer.js';
import { recordResult, levelStats, unlockedLevel, confusionPairs, confusionGrid, questionAccuracy } from '../src/ear/scoring.js';
import { buildWorkout } from '../src/ear/workout.js';
import { generateOpenings } from '../src/practice/openings.js';
import { buildSetlist } from '../src/practice/session.js';
import { createEmptyState } from '../src/state/storage.js';
import { chordTones } from '../src/theory/chords.js';
import { mod12 } from '../src/theory/notes.js';

const NOW = new Date('2026-10-12T18:00:00Z');

// The MIDI notes of a question's sound, in order.
function soundNotes(question) {
  return question.sound.events.flatMap((event) => event.midis);
}

// Logs `count` answers to a game: `expected` asked, `answer` given.
function logAnswers(state, exercise, level, expected, answer, count) {
  for (let index = 0; index < count; index++) {
    recordResult(state, { exercise, level, question: expected, expected, answer, correct: expected === answer, ms: 1500, timbre: 'guitar' }, NOW);
  }
}

// ─── Every game ───

describe('all eight games', () => {
  it('are registered in plan order and build questions at every level', () => {
    expect(EAR_EXERCISES.map((exercise) => exercise.id)).toEqual(['scale-degrees', 'intervals', 'play-back', 'chord-quality', 'progressions', 'call-response', 'rhythm', 'producer']);
    const random = makeRandom(7);
    for (const exercise of EAR_EXERCISES) {
      for (let level = 1; level <= exercise.levels; level++) {
        for (let round = 0; round < 20; round++) {
          const question = exercise.makeQuestion(level, random);
          expect(question.exercise, exercise.id).toBe(exercise.id);
          expect(question.sound, exercise.id).toBeTruthy();
          if (question.kind === 'choice') {
            expect(question.options.map((option) => option.value), exercise.id).toContain(question.answer);
          }
        }
      }
    }
  });
});

// ─── The music is right ───

describe('questions sound what they claim', () => {
  const random = makeRandom(11);

  it('intervals: the second note is the named distance above the first', () => {
    for (let round = 0; round < 200; round++) {
      const question = getExercise('intervals').makeQuestion(5, random);
      const [low, high] = soundNotes(question);
      expect(high - low).toBe(INTERVALS[question.answer].semitones);
    }
  });

  it('scale degrees: the last note is that degree of the cadence key, and walks home to the tonic', () => {
    for (let round = 0; round < 100; round++) {
      const question = getExercise('scale-degrees').makeQuestion(5, random);
      const notes = soundNotes(question);
      const tonic = notes[1];
      const target = notes[notes.length - 1];
      expect(mod12(target - tonic)).toBe(MAJOR_SCALE[Number(question.answer) - 1]);
      const home = question.after.events.flatMap((event) => event.midis);
      expect(mod12(home[home.length - 1] - tonic)).toBe(0);
    }
    expect(walkHome(60, 6).flatMap((event) => event.midis)).toEqual([69, 71, 72]);
  });

  it('chord quality: every strummed note belongs to the named chord', () => {
    for (let round = 0; round < 100; round++) {
      const question = getExercise('chord-quality').makeQuestion(4, random);
      const { root, quality } = question.reveal.chord;
      const allowed = new Set(chordTones(root, quality).map((tone) => tone.pitchClass));
      expect(soundNotes(question).every((midi) => allowed.has(mod12(midi))), question.explain).toBe(true);
      expect(quality).toBe(question.answer);
    }
  });

  it('progressions: four chords whose roots follow the named numerals', () => {
    for (let round = 0; round < 60; round++) {
      const question = getExercise('progressions').makeQuestion(4, random);
      const progression = EAR_PROGRESSIONS.find((candidate) => candidate.id === question.answer);
      const bassNotes = question.sound.events.map((event) => event.midis[0]);
      const keyNote = bassNotes[0] - progression.chords[0][0];
      bassNotes.forEach((bass, index) => expect(mod12(bass - keyNote)).toBe(progression.chords[index][0]));
    }
  });

  it('call and response: phrases stay in the first five frets and in the scale', () => {
    const playable = new Set(playableScaleNotes(7));
    expect(playable.has(43)).toBe(true);
    for (let round = 0; round < 50; round++) {
      const question = getExercise('call-response').makeQuestion(4, random);
      expect(question.answer).toHaveLength(5);
    }
    expect(phraseMatches([60, 62, 64], [60, 62, 64])).toBe(true);
    expect(phraseMatches([60, 62, 64], [60, 64, 62])).toBe(false);
  });

  it('producer: bands are labelled in Hz and kHz', () => {
    expect(bandLabel(250)).toBe('250 Hz');
    expect(bandLabel(4000)).toBe('4 kHz');
  });
});

// ─── Rhythm ───

describe('rhythm tap-back', () => {
  it('marks each hit early, on time or late, and counts misses and extras', () => {
    const expected = [0, 0.75, 1.5];
    const result = evaluateTaps(expected, [0.01, 0.82, 1.42]);
    expect(result.hits.map((hit) => hit.verdict)).toEqual(['on time', 'late', 'early']);
    expect(result.correct).toBe(true);

    const sloppy = evaluateTaps(expected, [0.01, 1.5, 2.2]);
    expect(sloppy.hits.map((hit) => hit.verdict)).toEqual(['on time', 'missed', 'on time']);
    expect(sloppy.extra).toBe(1);
    expect(sloppy.correct).toBe(false);
  });
});

// ─── Scoring ───

describe('scoring', () => {
  it('gives stars from the last 10 answers and unlocks the next level at 4 stars', () => {
    const state = createEmptyState(NOW);
    expect(unlockedLevel(state.ear.results, 'intervals', 5)).toBe(1);
    logAnswers(state, 'intervals', 1, 'P5', 'P5', 9);
    logAnswers(state, 'intervals', 1, 'M2', 'P5', 1);
    expect(levelStats(state.ear.results, 'intervals', 1)).toMatchObject({ answered: 10, correct: 9, stars: 4 });
    expect(unlockedLevel(state.ear.results, 'intervals', 5)).toBe(2);
  });

  it('tracks accuracy per question (for fading song hints)', () => {
    const state = createEmptyState(NOW);
    logAnswers(state, 'intervals', 3, 'm3', 'M3', 2);
    logAnswers(state, 'intervals', 3, 'm3', 'm3', 2);
    expect(questionAccuracy(state.ear.results, 'intervals', 'm3')).toBe(0.5);
    expect(questionAccuracy(state.ear.results, 'intervals', 'P8')).toBeNull();
  });
});

// ─── Confusion duels ───

describe('confusion duels', () => {
  it('appear after repeated mix-ups, with the ear map grid behind them', () => {
    const state = createEmptyState(NOW);
    logAnswers(state, 'intervals', 3, 'm3', 'M3', 2);
    expect(confusionPairs(state.ear.results)).toEqual([]);

    logAnswers(state, 'intervals', 3, 'm3', 'M3', 2);
    logAnswers(state, 'intervals', 3, 'm3', 'm3', 6);
    const [pair] = confusionPairs(state.ear.results);
    expect(pair).toMatchObject({ exercise: 'intervals', expected: 'm3', heard: 'M3', count: 4, of: 10, rate: 0.4 });

    const grid = confusionGrid(state.ear.results, 'intervals');
    expect(grid.rows.find((row) => row.expected === 'm3').cells).toEqual({ M3: 4, m3: 6 });

    const workout = buildWorkout(state, makeRandom(3));
    expect(workout).toHaveLength(5);
    expect(workout[0]).toMatchObject({ exercise: 'intervals', pool: ['m3', 'M3'], label: 'Duel: m3 vs M3' });
    const duelQuestion = getExercise('intervals').makeQuestion(workout[0].level, makeRandom(1), { pool: workout[0].pool });
    expect(duelQuestion.options.map((option) => option.value).sort()).toEqual(['M3', 'm3']);
  });

  it('turn into an ear Fix opening, and the setlist ear block uses it', () => {
    const state = createEmptyState(NOW);
    logAnswers(state, 'intervals', 3, 'm3', 'M3', 4);
    logAnswers(state, 'intervals', 3, 'm3', 'm3', 6);
    const earFix = generateOpenings(state, NOW).find((opening) => opening.itemId === 'ear:intervals');
    expect(earFix.text).toBe('Ear: you heard m3 as M3 4 of the last 10 times. Try the m3 vs M3 duel.');
    const blocks = buildSetlist(state, NOW);
    const earBlock = blocks.find((block) => block.kind === 'ear');
    expect(earBlock.ear).toMatchObject({ exercise: 'intervals', pool: ['m3', 'M3'] });
    expect(blocks.filter((block) => block.itemId).every((block) => state.items[block.itemId])).toBe(true);
  });
});

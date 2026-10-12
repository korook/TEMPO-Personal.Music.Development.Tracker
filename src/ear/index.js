// All eight ear games in the order of TEMPO_PLAN.md section 8.

import { scaleDegrees } from './scale-degrees.js';
import { intervals } from './intervals.js';
import { playBack } from './play-back.js';
import { chordQuality } from './chord-quality.js';
import { progressionDetective } from './progressions.js';
import { callResponse } from './call-response.js';
import { rhythmTapBack } from './rhythm.js';
import { producerEar } from './producer.js';

// ─── The games ───

export const EAR_EXERCISES = [scaleDegrees, intervals, playBack, chordQuality, progressionDetective, callResponse, rhythmTapBack, producerEar];

// Looks up a game by id.
export function getExercise(id) {
  const exercise = EAR_EXERCISES.find((candidate) => candidate.id === id);
  if (!exercise) throw new Error(`Unknown ear game "${id}".`);
  return exercise;
}

// The daily workout (TEMPO_PLAN.md section 8): five short drills mixed across the games.
// A confusion duel goes first when you keep mixing two answers up; then the games where
// you have the fewest stars, so the workout leans on what needs it.

import { EAR_EXERCISES, getExercise } from './index.js';
import { confusionPairs, levelStats, unlockedLevel } from './scoring.js';

const DRILLS = 5;
const QUESTIONS_PER_DRILL = 4;

// ─── Building ───

// Returns the drills: [{ exercise, level, pool, questions, label }].
export function buildWorkout(state, random = Math.random) {
  const results = state.ear.results;
  const drills = [];
  const [duel] = confusionPairs(results);
  if (duel) drills.push(duelDrill(results, duel));

  const ranked = EAR_EXERCISES
    .filter((exercise) => !drills.some((drill) => drill.exercise === exercise.id))
    .map((exercise) => {
      const level = unlockedLevel(results, exercise.id, exercise.levels);
      return { exercise, level, stars: levelStats(results, exercise.id, level).stars, tiebreak: random() };
    })
    .sort((a, b) => a.stars - b.stars || a.tiebreak - b.tiebreak);

  for (const { exercise, level } of ranked) {
    if (drills.length >= DRILLS) break;
    drills.push({ exercise: exercise.id, level, pool: null, questions: QUESTIONS_PER_DRILL, label: `${exercise.title}, level ${level}` });
  }
  return drills;
}

// A two-answer drill for a pair you keep mixing up.
export function duelDrill(results, pair) {
  const exercise = getExercise(pair.exercise);
  const level = unlockedLevel(results, exercise.id, exercise.levels);
  return {
    exercise: exercise.id,
    level,
    pool: [pair.expected, pair.heard],
    questions: QUESTIONS_PER_DRILL + 2,
    label: `Duel: ${pair.expected} vs ${pair.heard}`,
  };
}

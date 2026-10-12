// Scoring for the ear games (TEMPO_PLAN.md section 8): results, 1–5 stars per level,
// level unlocking, accuracy per answer (for fading song hints), and the confusion data
// behind the ear map and the confusion duels.
//
// A result: { exercise, level, question, expected, answer, correct, ms, timbre, at }
//   question = what was asked (e.g. "m3"), answer = what was picked.

const RECENT = 10;
const STARS_TO_UNLOCK = 4;
const DUEL_MIN_MIXUPS = 3;
const LOOKBACK = 40;

// ─── Recording ───

// Adds a result to the saved ear data and returns it.
export function recordResult(state, result, now = new Date()) {
  const record = { ...result, at: now.toISOString() };
  state.ear.results.push(record);
  return record;
}

// Returns the results of one game (and level, if given), oldest first.
export function resultsFor(results, exercise, level = null) {
  return results.filter((result) => result.exercise === exercise && (level === null || result.level === level));
}

// ─── Stars and levels ───

// Stars from 1 to 5 for an accuracy, or 0 before 5 answers.
export function starsFor(accuracy, answered) {
  if (answered < 5) return 0;
  if (accuracy >= 0.95) return 5;
  if (accuracy >= 0.85) return 4;
  if (accuracy >= 0.7) return 3;
  if (accuracy >= 0.5) return 2;
  return 1;
}

// Accuracy and stars over the last 10 answers at a level.
export function levelStats(results, exercise, level) {
  const recent = resultsFor(results, exercise, level).slice(-RECENT);
  const correct = recent.filter((result) => result.correct).length;
  const accuracy = recent.length ? correct / recent.length : 0;
  return { answered: recent.length, correct, accuracy, stars: starsFor(accuracy, recent.length) };
}

// The highest level open to you: level 1, plus each level whose previous level has 4+ stars.
export function unlockedLevel(results, exercise, levels) {
  let level = 1;
  while (level < levels && levelStats(results, exercise, level).stars >= STARS_TO_UNLOCK) level++;
  return level;
}

// How often you get one particular question right, over your last 20 tries (null if never asked).
export function questionAccuracy(results, exercise, question, count = 20) {
  const tries = resultsFor(results, exercise).filter((result) => result.question === question).slice(-count);
  return tries.length ? tries.filter((result) => result.correct).length / tries.length : null;
}

// ─── Confusions ───

// Answers that keep getting mixed up, e.g. m3 heard as M3: [{ exercise, expected, heard,
// count, of, rate }], most frequent first. `of` = how often `expected` was asked.
export function confusionPairs(results, exercise = null, minCount = DUEL_MIN_MIXUPS) {
  const exercises = exercise ? [exercise] : [...new Set(results.map((result) => result.exercise))];
  const pairs = [];
  for (const id of exercises) {
    const recent = resultsFor(results, id).filter((result) => typeof result.answer === 'string' && result.answer !== 'no').slice(-LOOKBACK);
    const asked = new Map();
    const mixed = new Map();
    for (const result of recent) {
      asked.set(result.expected, (asked.get(result.expected) || 0) + 1);
      if (!result.correct) {
        const key = `${result.expected}→${result.answer}`;
        mixed.set(key, (mixed.get(key) || 0) + 1);
      }
    }
    for (const [key, count] of mixed) {
      if (count < minCount) continue;
      const [expected, heard] = key.split('→');
      const of = asked.get(expected);
      pairs.push({ exercise: id, expected, heard, count, of, rate: count / of });
    }
  }
  return pairs.sort((a, b) => b.count - a.count || b.rate - a.rate);
}

// The ear map grid for one game: for each question asked, how often each answer was given.
// Returns { keys, rows: [{ expected, total, cells: { answer: count } }] }.
export function confusionGrid(results, exercise, lookback = 60) {
  const recent = resultsFor(results, exercise).filter((result) => typeof result.answer === 'string').slice(-lookback);
  const keys = [...new Set(recent.flatMap((result) => [result.expected, result.answer]))];
  const rows = keys
    .filter((key) => recent.some((result) => result.expected === key))
    .map((expected) => {
      const asked = recent.filter((result) => result.expected === expected);
      const cells = {};
      for (const result of asked) cells[result.answer] = (cells[result.answer] || 0) + 1;
      return { expected, total: asked.length, cells };
    });
  return { keys, rows };
}

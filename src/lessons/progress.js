// Theory progress: each finished exercise run or quiz is saved as one result in
// state.theory.results: { topic, part: 'exercise' | 'quiz' | 'lecture', id, score, total, missed, at }.
// A topic is done when the lecture is read, every exercise has a run at 80% or better,
// and the quiz has been passed at 80% or better.

const PASS_RATE = 0.8;

// ─── Saving ───

// Adds one finished run to the state (changes `state`).
export function recordTheoryRun(state, { topic, part, id, score, total, missed = [] }, now = new Date()) {
  state.theory.results.push({ topic, part, id, score, total, missed, at: now.toISOString() });
}

// Marks a lecture as read (once).
export function markLectureRead(state, topic, now = new Date()) {
  if (state.theory.results.some((result) => result.topic === topic && result.part === 'lecture')) return;
  state.theory.results.push({ topic, part: 'lecture', id: 'lecture', score: 1, total: 1, missed: [], at: now.toISOString() });
}

// ─── Reading ───

// The best run for one exercise or quiz: { score, total, rate } (null if never done).
export function bestRun(results, topic, part, id) {
  const runs = results.filter((result) => result.topic === topic && result.part === part && result.id === id);
  if (!runs.length) return null;
  const best = runs.reduce((top, run) => (run.score / run.total > top.score / top.total ? run : top));
  return { score: best.score, total: best.total, rate: best.score / best.total };
}

// How far a topic has got: { lectureRead, exercisesPassed, exerciseCount, quizBest, done, steps, stepsDone }.
export function topicProgress(results, topic) {
  const lectureRead = results.some((result) => result.topic === topic.id && result.part === 'lecture');
  const exercisesPassed = topic.exercises.filter((exercise) => {
    const best = bestRun(results, topic.id, 'exercise', exercise.id);
    return best && best.rate >= PASS_RATE;
  }).length;
  const quizBest = bestRun(results, topic.id, 'quiz', 'quiz');
  const quizPassed = Boolean(quizBest && quizBest.rate >= PASS_RATE);
  const steps = 2 + topic.exercises.length;
  const stepsDone = Number(lectureRead) + exercisesPassed + Number(quizPassed);
  return { lectureRead, exercisesPassed, exerciseCount: topic.exercises.length, quizBest, quizPassed, done: stepsDone === steps, steps, stepsDone };
}

// True when a run counts as a pass.
export function isPass(score, total) {
  return total > 0 && score / total >= PASS_RATE;
}

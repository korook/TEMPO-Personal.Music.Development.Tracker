// Loads the theory lessons from content/theory/ (TEMPO_PLAN.md section 9). topics.json lists
// all ten topics in order; each topic folder holds lecture.md, exercises.json and quiz.json.
// A topic without those files is shown as "being written". The files are bundled into the
// app at build time, so lessons also work offline and in the single-file preview.

import topicList from '../../content/theory/topics.json';
import { EXERCISE_TYPES } from './exercises.js';

const files = import.meta.glob('../../content/theory/*/*.{md,json}', { query: '?raw', import: 'default', eager: true });

// ─── Reading ───

// Returns every topic in order: { id, number, title, summary, ready, lecture, exercises, quiz }.
export function getTopics() {
  return topicList.topics.map((topic, index) => {
    const lecture = fileFor(topic.id, 'lecture.md');
    const exercises = fileFor(topic.id, 'exercises.json');
    const quiz = fileFor(topic.id, 'quiz.json');
    const ready = Boolean(lecture && exercises && quiz);
    return {
      ...topic,
      number: index + 1,
      ready,
      lecture: lecture || '',
      exercises: exercises ? JSON.parse(exercises).exercises : [],
      quiz: quiz ? JSON.parse(quiz).questions : [],
    };
  });
}

// Returns one topic by id (or null).
export function getTopic(id) {
  return getTopics().find((topic) => topic.id === id) || null;
}

// Returns a file's text from a topic folder (or null when it isn't written yet).
function fileFor(topicId, name) {
  return files[`../../content/theory/${topicId}/${name}`] || null;
}

// ─── Checking ───

// Lists the problems in a ready topic's files (used by the tests), or [] when it is fine.
export function findTopicProblems(topic) {
  const problems = [];
  if (!/^# /m.test(topic.lecture)) problems.push('lecture.md needs a "# " title');
  topic.exercises.forEach((exercise, index) => {
    if (!exercise.id || !exercise.title) problems.push(`exercise ${index + 1} needs an id and a title`);
    if (!EXERCISE_TYPES[exercise.type]) problems.push(`exercise ${exercise.id}: unknown type "${exercise.type}"`);
  });
  topic.quiz.forEach((question, index) => {
    const label = question.id || `question ${index + 1}`;
    if (!question.question) problems.push(`${label}: no question text`);
    if (!Array.isArray(question.options) || question.options.length < 2) problems.push(`${label}: needs at least two options`);
    else if (!Number.isInteger(question.answer) || !question.options[question.answer]) problems.push(`${label}: answer must be the index of an option`);
    if (!question.explanation) problems.push(`${label}: every answer needs an explanation`);
  });
  return problems;
}

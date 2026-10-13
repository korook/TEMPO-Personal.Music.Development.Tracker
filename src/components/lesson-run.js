// Runs a theory exercise or quiz (TEMPO_PLAN.md section 9) one question at a time:
//   choice  pick an answer (keys 1–9): quiz questions and "name the note"
//   tap     tap the answer on the neck (click, or Tab to a fret and press Enter)
// After each answer: right or wrong, the explanation and, for neck questions, the answer
// marked on the neck. At the end: the score, the ones you missed, and the run is saved.

import { makeExerciseQuestion, isCorrect } from '../lessons/exercises.js';
import { recordTheoryRun, isPass } from '../lessons/progress.js';
import { renderNeckMarks } from './neck.js';
import { playNote } from '../audio/guitar-synth.js';
import { updateState } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { STANDARD_TUNING } from '../theory/notes.js';
import { escapeHtml } from '../utils/html.js';

// The run on screen (one at a time).
let run = null;
let keyListenerAdded = false;

// ─── Starting ───

// Starts an exercise run: `exercise` is one entry from exercises.json.
export function mountExerciseRun(container, { topicId, exercise, backHref }) {
  const questions = generateQuestions(exercise, exercise.questions || 8);
  start(container, { topicId, part: 'exercise', id: exercise.id, title: exercise.title, questions, backHref, exercise });
}

// Starts a quiz run: `quiz` is the question list from quiz.json.
export function mountQuizRun(container, { topicId, quiz, backHref }) {
  const questions = quiz.map((question) => ({
    type: 'quiz',
    id: question.id,
    prompt: question.question,
    options: question.options.map((label, index) => ({ value: String(index), label })),
    answer: String(question.answer),
    explain: question.explanation,
  }));
  start(container, { topicId, part: 'quiz', id: 'quiz', title: 'Quiz', questions, backHref });
}

// Builds `count` questions, trying not to ask the same thing twice in a row.
function generateQuestions(exercise, count) {
  const questions = [];
  let attempts = 0;
  while (questions.length < count) {
    const question = makeExerciseQuestion(exercise);
    const previous = questions[questions.length - 1];
    attempts++;
    if (previous && previous.explain === question.explain && attempts < count * 10) continue;
    questions.push(question);
  }
  return questions;
}

// Sets up the run state and draws the first question.
function start(container, { topicId, part, id, title, questions, backHref, exercise = null }) {
  run = { container, topicId, part, id, title, questions, backHref, exercise, index: 0, phase: 'ask', picked: null, correct: null, score: 0, missed: [] };
  if (!keyListenerAdded) {
    keyListenerAdded = true;
    document.addEventListener('keydown', handleKeys);
  }
  draw();
}

// ─── Drawing ───

// Redraws the run.
function draw() {
  if (!run || !run.container.isConnected) return;
  run.container.innerHTML = run.phase === 'done' ? renderSummary() : renderQuestion();
  bind();
}

// One question: its prompt, the neck if it has one, the answers, and the feedback.
function renderQuestion() {
  const question = run.questions[run.index];
  return `
    <div class="ear-quiz lesson-run">
      <div class="ear-quiz__head">
        <span class="label">${escapeHtml(run.title)} · question ${run.index + 1} of ${run.questions.length}</span>
        <span class="label">${run.score} right so far</span>
      </div>
      <p class="ear-quiz__prompt">${escapeHtml(question.prompt)}</p>
      ${question.marks ? renderQuestionNeck(question) : ''}
      ${question.options ? renderOptions(question) : ''}
      ${run.phase === 'answered' ? renderFeedback(question) : ''}
    </div>`;
}

// The neck for a question: its marks, tappable strings while asking, and the answer once answered.
function renderQuestionNeck(question) {
  const answered = run.phase === 'answered';
  let marks = question.marks;
  if (answered) {
    const wrongTap = run.picked && typeof run.picked === 'object' && !run.correct ? [{ ...run.picked, label: '✕', kind: 'wrong' }] : [];
    marks = [...question.marks.filter((mark) => mark.kind !== 'question'), ...wrongTap, ...question.reveal];
  }
  return renderNeckMarks(marks, {
    leftHanded: getSettings().leftHanded,
    description: question.prompt,
    inputStrings: answered ? [] : question.inputStrings,
    maxFret: question.maxFret,
  });
}

// The answer buttons for a choice question.
function renderOptions(question) {
  const locked = run.phase === 'answered';
  return `<div class="ear-options">${question.options.map((option, index) => {
    const state = locked && option.value === question.answer ? ' ear-option--right' : locked && option.value === run.picked ? ' ear-option--wrong' : '';
    return `<button class="button ear-option${state}" data-answer="${escapeHtml(option.value)}" ${locked ? 'disabled' : ''}><span class="label">${index + 1}</span>${escapeHtml(option.label)}</button>`;
  }).join('')}</div>`;
}

// Right or wrong, the explanation, and the next button.
function renderFeedback(question) {
  const last = run.index === run.questions.length - 1;
  return `
    <div class="ear-feedback ear-feedback--${run.correct ? 'right' : 'wrong'}" role="status">
      <p><strong>${run.correct ? 'Right.' : 'Not quite.'}</strong> ${escapeHtml(question.explain)}</p>
      <button class="button button--primary" data-next>${last ? 'See your score' : 'Next'} <span class="label">⏎</span></button>
    </div>`;
}

// The end of the run: score, pass or not, the questions missed, and what to do next.
function renderSummary() {
  const total = run.questions.length;
  const passed = isPass(run.score, total);
  const missedQuiz = run.part === 'quiz' ? run.missed.map((index) => run.questions[index]) : [];
  return `
    <div class="ear-quiz ear-quiz--done lesson-run">
      <span class="label">${escapeHtml(run.title)} · finished</span>
      <p class="ear-quiz__prompt">${run.score} of ${total} right.</p>
      <p>${passed ? 'That counts as a pass (80% or more). It is saved on the topic page.' : 'A pass is 80% or more. Run it again; it gets easier each time.'}</p>
      ${missedQuiz.length ? `<ul class="lesson-run__missed">${missedQuiz.map((question) => `<li><strong>${escapeHtml(question.prompt)}</strong> ${escapeHtml(question.options[Number(question.answer)].label)}. ${escapeHtml(question.explain)}</li>`).join('')}</ul>` : ''}
      <div class="measure__row">
        <button class="button button--primary" data-again>Run it again</button>
        <a class="button" href="${escapeHtml(run.backHref)}">Back to the topic</a>
      </div>
    </div>`;
}

// ─── Events ───

// Connects the buttons and the tappable frets.
function bind() {
  const root = run.container;
  root.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => answer(button.dataset.answer)));
  root.querySelectorAll('.neck-hit').forEach((spot) => {
    const tap = () => answer({ string: Number(spot.dataset.string), fret: Number(spot.dataset.fret) });
    spot.addEventListener('click', tap);
    spot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        tap();
      }
    });
  });
  const next = root.querySelector('[data-next]');
  if (next) {
    next.addEventListener('click', nextQuestion);
    next.focus({ preventScroll: true });
  }
  const again = root.querySelector('[data-again]');
  if (again) again.addEventListener('click', restart);
}

// Keys: 1–9 answer a choice question, Enter moves on.
function handleKeys(event) {
  if (!run || !run.container.isConnected || run.phase === 'done') return;
  if (event.target.closest && event.target.closest('input, select, textarea, .neck-hit')) return;
  const question = run.questions[run.index];
  if (run.phase === 'ask' && question.options && /^[1-9]$/.test(event.key)) {
    const option = question.options[Number(event.key) - 1];
    if (option) {
      event.preventDefault();
      answer(option.value);
    }
  } else if (event.key === 'Enter' && run.phase === 'answered' && !event.target.closest('button, a')) {
    event.preventDefault();
    nextQuestion();
  }
}

// ─── Answering ───

// Checks an answer (an option value or a tapped { string, fret }) and shows the feedback.
function answer(value) {
  if (run.phase !== 'ask') return;
  const question = run.questions[run.index];
  const correct = question.type === 'quiz' ? value === question.answer : isCorrect(question, value);
  if (typeof value === 'object') playNote(STANDARD_TUNING[value.string] + value.fret);
  run.picked = value;
  run.correct = correct;
  run.phase = 'answered';
  if (correct) run.score++;
  else run.missed.push(run.index);
  draw();
}

// Moves on, or finishes and saves the run.
function nextQuestion() {
  if (run.index < run.questions.length - 1) {
    run.index++;
    Object.assign(run, { phase: 'ask', picked: null, correct: null });
    draw();
    return;
  }
  run.phase = 'done';
  const { topicId, part, id, score, questions, missed } = run;
  updateState((state) => recordTheoryRun(state, { topic: topicId, part, id, score, total: questions.length, missed: missed.map((index) => questions[index].id || index) }));
  draw();
}

// Starts the same exercise or quiz again with fresh questions.
function restart() {
  const questions = run.exercise ? generateQuestions(run.exercise, run.questions.length) : run.questions;
  start(run.container, { ...run, questions });
}

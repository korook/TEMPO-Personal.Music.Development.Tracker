// The ear quiz player: runs a list of drills (game, level, optional duel pool, number of
// questions) and handles every kind of answer:
//   choice     pick one answer (keys 1–9); song hints fade as your accuracy grows
//   self       find it on your guitar, reveal it on the neck, then say if you found it
//   fretboard  play the phrase back on a small fretboard (first five frets)
//   tap        tap the rhythm back after a count-in (Space or the tap key)
// After each answer: right / wrong, the explanation, the answer on the fretboard, and for
// scale degrees the note walking home. Results are saved for scoring.

import { getExercise } from '../ear/index.js';
import { recordResult, questionAccuracy, levelStats } from '../ear/scoring.js';
import { SONG_ANCHORS } from '../ear/common.js';
import { phraseMatches, INPUT_FRETS } from '../ear/call-response.js';
import { evaluateTaps, BEAT_SECONDS } from '../ear/rhythm.js';
import { playEvents, playClicks, playMixLoop, stopAll, TIMBRES } from '../audio/instruments.js';
import { getAudioContext } from '../audio/engine.js';
import { renderNeck, renderNeckForNotes } from './neck.js';
import { getState, updateState } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { STANDARD_TUNING, STRING_NAMES } from '../theory/notes.js';
import { escapeHtml } from '../utils/html.js';

const HINT_FADES_AT = 0.7;
const FLASH_SECONDS = 4;

// The quiz on screen (one at a time).
let quiz = null;
let keyListenerAdded = false;

// ─── Starting ───

// Starts a quiz inside `container`. drills = [{ exercise, level, pool, questions, label }].
// onFinish({ correct, total }) runs after the last question.
export function mountEarQuiz(container, { drills, onFinish = () => {}, compact = false }) {
  stopAll();
  quiz = {
    container,
    drills,
    onFinish,
    compact,
    drillIndex: 0,
    number: 0,
    question: null,
    timbre: 'guitar',
    phase: 'ask',          // 'ask' | 'answered' | 'done'
    revealed: false,
    picked: null,
    correct: null,
    started: 0,
    played: [],            // notes played on the fretboard
    taps: null,            // { start, times } while tapping
    tapResult: null,
    flash: false,
    flashTimer: null,
    tally: { correct: 0, total: 0 },
  };
  if (!keyListenerAdded) {
    keyListenerAdded = true;
    document.addEventListener('keydown', handleKeys);
  }
  nextQuestion();
}

// Moves to the next question (or the next drill, or the end).
function nextQuestion() {
  stopAll();
  clearTimeout(quiz.flashTimer);
  const drill = quiz.drills[quiz.drillIndex];
  if (quiz.number >= drill.questions) {
    quiz.drillIndex++;
    quiz.number = 0;
    if (quiz.drillIndex >= quiz.drills.length) {
      quiz.phase = 'done';
      draw();
      quiz.onFinish({ ...quiz.tally });
      return;
    }
  }
  const current = quiz.drills[quiz.drillIndex];
  quiz.number++;
  quiz.question = getExercise(current.exercise).makeQuestion(current.level, Math.random, { pool: current.pool });
  quiz.timbre = pickTimbre();
  Object.assign(quiz, { phase: 'ask', revealed: false, picked: null, correct: null, played: [], taps: null, tapResult: null, started: performance.now() });
  draw();
}

// Picks a timbre for the next question from the ones switched on.
function pickTimbre() {
  const enabled = getSettings().earTimbres || Object.keys(TIMBRES);
  return enabled[Math.floor(Math.random() * enabled.length)] || 'guitar';
}

// ─── Drawing ───

// Redraws the quiz.
function draw() {
  if (!quiz || !quiz.container.isConnected) return;
  quiz.container.innerHTML = quiz.phase === 'done' ? renderDone() : renderQuestion();
  bind();
}

// The current question with its controls, and the feedback once answered.
function renderQuestion() {
  const drill = quiz.drills[quiz.drillIndex];
  const question = quiz.question;
  const exercise = getExercise(drill.exercise);
  const stats = levelStats(getState().ear.results, exercise.id, drill.level);
  const stars = '★'.repeat(stats.stars) + '☆'.repeat(5 - stats.stars);
  return `
    <div class="ear-quiz${quiz.compact ? ' ear-quiz--compact' : ''}">
      <div class="ear-quiz__head">
        <span class="label">${escapeHtml(drill.label || `${exercise.title}, level ${drill.level}`)} · question ${quiz.number} of ${drill.questions}</span>
        <span class="label ear-quiz__stars" aria-label="${stats.stars} of 5 stars at this level">${stars}</span>
      </div>
      <p class="ear-quiz__prompt">${escapeHtml(question.prompt)}</p>
      <div class="measure__row">
        <button class="button" data-ear-play>▶ ${question.kind === 'tap' ? 'Hear the rhythm' : 'Play'} <span class="label">R</span></button>
        ${question.sound.type === 'mix' ? '<button class="button" data-ear-flat>Hear it flat</button>' : ''}
        ${question.sound.type === 'notes' ? `<span class="label">sound: ${TIMBRES[quiz.timbre]}</span>` : ''}
        ${exercise.id === 'chord-quality' && !quiz.compact ? `<button class="chip" data-ear-flash aria-pressed="${quiz.flash}">Flash: ${FLASH_SECONDS} s to answer</button>` : ''}
      </div>
      ${renderAnswerArea()}
      ${quiz.phase === 'answered' ? renderFeedback() : ''}
    </div>`;
}

// The answer controls for the question's kind.
function renderAnswerArea() {
  const question = quiz.question;
  const locked = quiz.phase === 'answered';
  if (question.kind === 'choice') {
    return `<div class="ear-options">${question.options.map((option, index) => {
      const state = locked && option.value === question.answer ? ' ear-option--right' : locked && option.value === quiz.picked ? ' ear-option--wrong' : '';
      return `<button class="button ear-option${state}" data-ear-answer="${escapeHtml(option.value)}" ${locked ? 'disabled' : ''}><span class="label">${index + 1}</span>${escapeHtml(option.label)}${renderHint(option.value)}</button>`;
    }).join('')}</div>`;
  }
  if (question.kind === 'self') {
    if (!quiz.revealed) return '<div class="measure__row"><button class="button button--primary" data-ear-reveal>Show me where</button></div>';
    return `${renderReveal()}${locked ? '' : `<div class="measure__row">${question.options.map((option) => `<button class="button${option.value === 'yes' ? ' button--primary' : ''}" data-ear-answer="${option.value}">${option.label}</button>`).join('')}</div>`}`;
  }
  if (question.kind === 'fretboard') return renderFretInput();
  if (question.kind === 'tap') return renderTapArea();
  return '';
}

// A fading song hint under an interval answer (hidden once you get it right 70% of the time).
function renderHint(value) {
  if (quiz.question.exercise !== 'intervals' || !SONG_ANCHORS[value]) return '';
  const accuracy = questionAccuracy(getState().ear.results, 'intervals', value);
  if (accuracy !== null && accuracy >= HINT_FADES_AT) return '';
  return `<span class="ear-option__hint">${escapeHtml(SONG_ANCHORS[value])}</span>`;
}

// The small fretboard for call and response: 6 strings × frets 0–5.
function renderFretInput() {
  const locked = quiz.phase === 'answered';
  const rows = STRING_NAMES.map((name, string) => ({ name, string })).reverse().map(({ name, string }) => `
    <div class="fret-input__row">
      <span class="label">${name}</span>
      ${Array.from({ length: INPUT_FRETS + 1 }, (_, fret) => `<button class="fret-input__key" data-ear-fret="${STANDARD_TUNING[string] + fret}" aria-label="${name} string, fret ${fret}" ${locked ? 'disabled' : ''}>${fret}</button>`).join('')}
    </div>`).join('');
  return `
    <div class="fret-input" role="group" aria-label="Fretboard, first five frets">${rows}</div>
    <div class="measure__row">
      <span class="label">Played ${quiz.played.length} of ${quiz.question.answer.length}</span>
      ${locked ? '' : '<button class="button" data-ear-clear>Start over</button>'}
    </div>`;
}

// The tap pad for rhythm tap-back.
function renderTapArea() {
  if (quiz.phase === 'answered' && quiz.tapResult) {
    return `<ol class="tap-results">${quiz.tapResult.hits.map((hit, index) => `<li class="tap-results__hit tap-results__hit--${hit.verdict.replace(' ', '-')}"><span class="label">${index + 1}</span>${hit.verdict}${hit.offset !== null ? ` <span class="label">${Math.round(hit.offset * 1000)} ms</span>` : ''}</li>`).join('')}${quiz.tapResult.extra ? `<li class="tap-results__hit tap-results__hit--missed">${quiz.tapResult.extra} extra tap${quiz.tapResult.extra === 1 ? '' : 's'}</li>` : ''}</ol>`;
  }
  if (quiz.taps) return '<button class="button button--live tap-key" data-ear-tap>Tap (Space)</button>';
  return '<div class="measure__row"><button class="button button--primary" data-ear-turn>My turn: count-in, then tap</button></div>';
}

// Right or wrong, the explanation, the answer on the neck, and the Next key.
function renderFeedback() {
  const question = quiz.question;
  const answerLabel = question.kind === 'choice' ? (question.options.find((option) => option.value === question.answer) || {}).label : '';
  const verdict = quiz.correct ? 'Right.' : question.kind === 'choice' ? `Not quite: it was ${answerLabel}.` : 'Not quite this time.';
  return `
    <div class="ear-feedback ear-feedback--${quiz.correct ? 'right' : 'wrong'}" role="status">
      <p><strong>${escapeHtml(verdict)}</strong> ${escapeHtml(question.explain || '')}</p>
      ${question.kind !== 'self' ? renderReveal() : ''}
      <button class="button button--primary" data-ear-next>Next ⏎</button>
    </div>`;
}

// The answer on the fretboard: interval notes or the chord shape.
function renderReveal() {
  const reveal = quiz.question.reveal;
  if (!reveal) return '';
  const leftHanded = getSettings().leftHanded;
  if (reveal.notes) return renderNeckForNotes(reveal.notes, { leftHanded, description: 'Where the two notes are on the neck' });
  if (reveal.chord) return renderNeck(reveal.chord.root, reveal.chord.quality, { voicing: reveal.chord.voicing, leftHanded });
  return '';
}

// The end of the quiz.
function renderDone() {
  const { correct, total } = quiz.tally;
  return `
    <div class="ear-quiz ear-quiz--done">
      <p class="ear-quiz__prompt">Done: ${correct} of ${total} right.</p>
      <p class="progress-empty">Results are saved; mix-ups you repeat turn into duels and Fix openings.</p>
    </div>`;
}

// ─── Events ───

// Connects the buttons of the current view.
function bind() {
  const root = quiz.container;
  onClick(root, '[data-ear-play]', playQuestion);
  onClick(root, '[data-ear-flat]', () => playMixLoop(null));
  onClick(root, '[data-ear-reveal]', () => { quiz.revealed = true; draw(); });
  onClick(root, '[data-ear-next]', nextQuestion);
  onClick(root, '[data-ear-clear]', () => { quiz.played = []; draw(); });
  onClick(root, '[data-ear-turn]', startTapping);
  onClick(root, '[data-ear-tap]', recordTap);
  onClick(root, '[data-ear-flash]', () => { quiz.flash = !quiz.flash; draw(); });
  root.querySelectorAll('[data-ear-answer]').forEach((button) => {
    button.addEventListener('click', () => answer(button.dataset.earAnswer));
  });
  root.querySelectorAll('[data-ear-fret]').forEach((key) => {
    key.addEventListener('click', () => playFret(Number(key.dataset.earFret)));
  });
}

// Adds a click handler if the element exists.
function onClick(root, selector, handler) {
  const element = root.querySelector(selector);
  if (element) element.addEventListener('click', handler);
}

// Keys: 1–9 answer, R replay, Enter next, Space tap.
function handleKeys(event) {
  if (!quiz || !quiz.container.isConnected || quiz.phase === 'done') return;
  if (event.target.closest && event.target.closest('input, select, textarea')) return;
  const question = quiz.question;
  if (quiz.phase === 'ask' && question.kind === 'choice' && /^[1-9]$/.test(event.key)) {
    const option = question.options[Number(event.key) - 1];
    if (option) { event.preventDefault(); answer(option.value); }
  } else if (event.key === 'Enter' && quiz.phase === 'answered' && !event.target.closest('button')) {
    event.preventDefault();
    nextQuestion();
  } else if ((event.key === 'r' || event.key === 'R') && quiz.phase === 'ask') {
    playQuestion();
  } else if (event.key === ' ' && quiz.taps) {
    event.preventDefault();
    recordTap();
  }
}

// ─── Sound ───

// Plays the question's sound, and starts the flash timer if it is on.
async function playQuestion() {
  const sound = quiz.question.sound;
  if (sound.type === 'notes') await playEvents(sound.events, quiz.timbre);
  if (sound.type === 'mix') await playMixLoop(sound.boostHz);
  if (sound.type === 'rhythm') {
    const countIn = [0, 1, 2, 3].map((beat) => beat * BEAT_SECONDS);
    const onsets = sound.onsets.map((eighth) => 4 * BEAT_SECONDS + eighth * BEAT_SECONDS / 2);
    await playClicks([...countIn, ...onsets], [0]);
  }
  if (quiz.flash && quiz.question.exercise === 'chord-quality' && quiz.phase === 'ask') {
    clearTimeout(quiz.flashTimer);
    quiz.flashTimer = setTimeout(() => { if (quiz.phase === 'ask') finish(false, null); }, (FLASH_SECONDS + 3) * 1000);
  }
}

// Plays a note from the small fretboard and checks the phrase once it's complete.
function playFret(midi) {
  playEvents([{ midis: [midi], at: 0, duration: 0.7 }], quiz.timbre);
  quiz.played.push(midi);
  if (quiz.played.length >= quiz.question.answer.length) {
    finish(phraseMatches(quiz.question.answer, quiz.played), null);
  } else {
    draw();
  }
}

// ─── Rhythm ───

// Plays a count-in, then listens for taps for one bar.
async function startTapping() {
  const start = await playClicks([0, 1, 2, 3].map((beat) => beat * BEAT_SECONDS), [0]);
  quiz.taps = { start: start + 4 * BEAT_SECONDS, times: [] };
  draw();
  setTimeout(() => {
    if (!quiz.taps) return;
    quiz.tapResult = evaluateTaps(quiz.question.answer, quiz.taps.times);
    quiz.taps = null;
    finish(quiz.tapResult.correct, null);
  }, (4 * BEAT_SECONDS + 4 * BEAT_SECONDS + 0.4) * 1000 + 100);
}

// Records one tap against the audio clock.
function recordTap() {
  if (!quiz.taps) return;
  quiz.taps.times.push(getAudioContext().currentTime - quiz.taps.start);
}

// ─── Answering ───

// Handles a picked answer.
function answer(value) {
  if (quiz.phase !== 'ask') return;
  finish(value === quiz.question.answer, value);
}

// Saves the result, shows the feedback and plays any follow-up sound.
function finish(correct, picked) {
  clearTimeout(quiz.flashTimer);
  const question = quiz.question;
  const drill = quiz.drills[quiz.drillIndex];
  Object.assign(quiz, { phase: 'answered', correct, picked });
  quiz.tally.total++;
  if (correct) quiz.tally.correct++;
  updateState((state) => recordResult(state, {
    exercise: question.exercise,
    level: drill.level,
    question: question.key,
    expected: typeof question.answer === 'string' ? question.answer : null,
    answer: typeof picked === 'string' ? picked : null,
    correct,
    ms: Math.round(performance.now() - quiz.started),
    timbre: quiz.timbre,
  }));
  draw();
  if (question.after) playEvents(question.after.events, quiz.timbre);
}

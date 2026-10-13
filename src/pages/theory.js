// The Theory page (TEMPO_PLAN.md section 9). Views:
//   #/theory                                  the ten topics, with where to continue
//   #/theory/<topic>                          the lecture
//   #/theory/<topic>/exercises                the exercises with your best scores
//   #/theory/<topic>/exercises/<exercise>     one exercise run
//   #/theory/<topic>/quiz                     the quiz
// Lessons come from content/theory/ (see src/lessons/content.js). Topics that aren't
// written yet are listed as "being written".

import { getTopics, getTopic } from '../lessons/content.js';
import { renderMarkdown } from '../lessons/markdown.js';
import { renderLessonEmbed } from '../lessons/embeds.js';
import { topicProgress, bestRun, markLectureRead } from '../lessons/progress.js';
import { mountExerciseRun, mountQuizRun } from '../components/lesson-run.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
import { getState, updateState } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { navigate } from '../router.js';
import { escapeHtml } from '../utils/html.js';

// ─── Routing ───

// Draws the view for the address after #/theory.
export function renderTheoryPage(path = '') {
  const [topicId, part, exerciseId] = path ? path.split('/') : [];
  if (!topicId) return renderOverview();
  const topic = getTopic(topicId);
  if (!topic || !topic.ready) {
    navigate('#/theory');
    return;
  }
  if (part === 'exercises' && exerciseId) return renderExercise(topic, exerciseId);
  if (part === 'exercises') return renderExerciseList(topic);
  if (part === 'quiz') return renderQuiz(topic);
  return renderLecture(topic);
}

// The page element.
function page() {
  return document.getElementById('pg-theory');
}

// The link to a topic, or to one part of it.
function topicLink(topic, part = '') {
  return `#/theory/${topic.id}${part ? `/${part}` : ''}`;
}

// ─── Overview ───

// The ten topics in order, with the next step to take.
function renderOverview() {
  const results = getState().theory.results;
  const topics = getTopics();
  const next = topics.find((topic) => topic.ready && !topicProgress(results, topic).done);
  page().innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Music theory</span>
        <h1 class="section-head__title section-head__title--hero">Theory</h1>
        <p class="section-head__lead">Short lessons you can use on the guitar straight away. Each topic has a lesson, exercises on the neck and a quiz.</p>
      </div>
    </header>
    ${next ? renderContinue(next, results) : ''}
    <h2 class="section-label">Ten topics</h2>
    <ol class="theory-topics">${topics.map((topic) => renderTopicCard(topic, results)).join('')}</ol>`;
}

// The "continue here" panel for the first topic that isn't finished.
function renderContinue(topic, results) {
  const progress = topicProgress(results, topic);
  const nextPart = !progress.lectureRead ? '' : progress.exercisesPassed < progress.exerciseCount ? 'exercises' : 'quiz';
  const action = !progress.lectureRead ? 'Read the lesson' : nextPart === 'exercises' ? 'Do the exercises' : 'Take the quiz';
  return `
    <section class="panel theory-continue">
      ${renderArtPlaceholder('cover', topic.title, `cover:theory-${topic.id}`)}
      <div class="theory-continue__text">
        <span class="label">${progress.stepsDone ? 'Continue' : 'Start here'} · topic ${topic.number}</span>
        <h2 class="theory-continue__title">${escapeHtml(topic.title)}</h2>
        <p>${escapeHtml(topic.summary)}</p>
        ${renderSteps(topic, progress)}
        <a class="button button--primary" href="${topicLink(topic, nextPart)}">${action}</a>
      </div>
    </section>`;
}

// One topic in the list: a link when it is written, a quiet card when it isn't yet.
function renderTopicCard(topic, results) {
  const number = String(topic.number).padStart(2, '0');
  if (!topic.ready) {
    return `
      <li class="theory-topic theory-topic--later">
        <span class="label">${number}</span>
        <span class="theory-topic__title">${escapeHtml(topic.title)}</span>
        <span class="theory-topic__summary">${escapeHtml(topic.summary)}</span>
        <span class="label">Being written</span>
      </li>`;
  }
  const progress = topicProgress(results, topic);
  return `
    <li>
      <a class="theory-topic" href="${topicLink(topic)}">
        <span class="label">${number}</span>
        <span class="theory-topic__title">${escapeHtml(topic.title)}</span>
        <span class="theory-topic__summary">${escapeHtml(topic.summary)}</span>
        <span class="label">${progress.done ? 'Done ✓' : `${progress.stepsDone} of ${progress.steps} steps`}</span>
      </a>
    </li>`;
}

// The steps of a topic as LED dots: lesson, each exercise, quiz.
function renderSteps(topic, progress) {
  const dots = [progress.lectureRead, ...topic.exercises.map((_, index) => index < progress.exercisesPassed), progress.quizPassed];
  return `<span class="theory-steps" aria-label="${progress.stepsDone} of ${progress.steps} steps done">${dots.map((on) => `<span class="theory-steps__dot${on ? ' theory-steps__dot--on' : ''}"></span>`).join('')}</span>`;
}

// ─── One topic ───

// The topic head: back link, title and the Lesson / Exercises / Quiz switch.
function renderTopicHead(topic, current) {
  const progress = topicProgress(getState().theory.results, topic);
  const tab = (part, label, done) => `<a class="chip" href="${topicLink(topic, part)}" ${current === part ? 'aria-current="page"' : ''}>${label}${done ? ' ✓' : ''}</a>`;
  return `
    <header class="page-head">
      <a class="back-link" href="#/theory">← Theory</a>
      <div class="section-head">
        <span class="section-head__kicker">Theory · topic ${topic.number} of 10</span>
        <h1 class="section-head__title section-head__title--hero">${escapeHtml(topic.title)}</h1>
      </div>
      <nav class="chip-row" aria-label="Parts of this topic">
        ${tab('', 'Lesson', progress.lectureRead)}
        ${tab('exercises', `Exercises ${progress.exercisesPassed}/${progress.exerciseCount}`, progress.exercisesPassed === progress.exerciseCount)}
        ${tab('quiz', 'Quiz', progress.quizPassed)}
      </nav>
    </header>`;
}

// The lecture, with a button at the end that marks it read and moves on to the exercises.
function renderLecture(topic) {
  const leftHanded = getSettings().leftHanded;
  const body = renderMarkdown(topic.lecture.replace(/^# .*\n/, ''), { embed: (name, options) => renderLessonEmbed(name, options, { leftHanded }) });
  page().innerHTML = `
    ${renderTopicHead(topic, '')}
    <article class="panel lesson">${body}
      <div class="lesson__end">
        <button class="button button--primary" data-read>I've read it: on to the exercises</button>
      </div>
    </article>`;
  page().querySelector('[data-read]').addEventListener('click', () => {
    updateState((state) => markLectureRead(state, topic.id));
    navigate(topicLink(topic, 'exercises'));
  });
}

// The exercises with their best scores.
function renderExerciseList(topic) {
  const results = getState().theory.results;
  page().innerHTML = `
    ${renderTopicHead(topic, 'exercises')}
    <section class="panel">
      <h2 class="panel__title">Exercises</h2>
      <p class="progress-empty">Tap the answers on the neck or pick them from the buttons. 80% or more counts as a pass.</p>
      <ol class="theory-exercises">${topic.exercises.map((exercise, index) => {
        const best = bestRun(results, topic.id, 'exercise', exercise.id);
        return `
          <li class="theory-exercise">
            <span class="label">${String(index + 1).padStart(2, '0')}</span>
            <span class="theory-exercise__title">${escapeHtml(exercise.title)}</span>
            <span class="label">${best ? `best ${best.score}/${best.total}${best.rate >= 0.8 ? ' ✓' : ''}` : `${exercise.questions || 8} questions`}</span>
            <a class="button" href="${topicLink(topic, `exercises/${exercise.id}`)}">${best ? 'Again' : 'Start'}</a>
          </li>`;
      }).join('')}</ol>
      <a class="button button--primary" href="${topicLink(topic, 'quiz')}">On to the quiz</a>
    </section>`;
}

// One exercise run.
function renderExercise(topic, exerciseId) {
  const exercise = topic.exercises.find((candidate) => candidate.id === exerciseId);
  if (!exercise) {
    navigate(topicLink(topic, 'exercises'));
    return;
  }
  page().innerHTML = `${renderTopicHead(topic, 'exercises')}<section class="panel" data-run></section>`;
  mountExerciseRun(page().querySelector('[data-run]'), { topicId: topic.id, exercise, backHref: topicLink(topic, 'exercises') });
}

// The quiz.
function renderQuiz(topic) {
  const best = bestRun(getState().theory.results, topic.id, 'quiz', 'quiz');
  page().innerHTML = `
    ${renderTopicHead(topic, 'quiz')}
    ${best ? `<p class="progress-empty">Your best so far: ${best.score} of ${best.total}.</p>` : ''}
    <section class="panel" data-run></section>`;
  mountQuizRun(page().querySelector('[data-run]'), { topicId: topic.id, quiz: topic.quiz, backHref: topicLink(topic) });
}

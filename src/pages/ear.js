// The Ear training page (TEMPO_PLAN.md section 8), in four views:
//   #/ear                      overview: daily workout, confusion duels, the eight games as
//                              cover tiles with stars, the ear map, and which sounds to use
//   #/ear/<game>               one game at a level you have unlocked
//   #/ear/workout              the daily workout: five short drills
//   #/ear/duel/<game>/<a>~<b>  a two-answer drill for a pair you keep mixing up

import { EAR_EXERCISES, getExercise } from '../ear/index.js';
import { levelStats, unlockedLevel, confusionPairs, confusionGrid } from '../ear/scoring.js';
import { buildWorkout, duelDrill } from '../ear/workout.js';
import { TIMBRES } from '../audio/instruments.js';
import { mountEarQuiz } from '../components/ear-quiz.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
import { getState } from '../state/storage.js';
import { getSettings, updateSettings } from '../state/settings.js';
import { navigate } from '../router.js';
import { escapeHtml } from '../utils/html.js';

const GAME_QUESTIONS = 10;
const levelChoice = new Map();

// ─── Routing ───

// Draws the view for the address after #/ear.
export function renderEarPage(path = '') {
  const parts = path ? path.split('/') : [];
  if (parts[0] === 'workout') return renderWorkout();
  if (parts[0] === 'duel' && parts[2]) return renderDuel(parts[1], parts[2].split('~'));
  if (parts[0]) return renderGame(parts[0]);
  return renderOverview();
}

// The page element.
function page() {
  return document.getElementById('pg-ear');
}

// ─── Overview ───

// Workout, duels, the games, the ear map and the sound choice.
function renderOverview() {
  const state = getState();
  const workout = buildWorkout(state);
  const duels = confusionPairs(state.ear.results).slice(0, 4);
  page().innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Ear training</span>
        <h1 class="section-head__title section-head__title--hero">Ear</h1>
        <p class="section-head__lead">Eight listening games. Start with the daily workout: five short drills that lean on what needs it.</p>
      </div>
    </header>
    <div class="split">
      <section class="panel"><h2 class="panel__title">Today's workout</h2>
        <ol class="today-setlist__list">${workout.map((drill, index) => `<li><span class="label">${String(index + 1).padStart(2, '0')}</span><span class="today-setlist__kind">${drill.pool ? 'Duel' : 'Drill'}</span><span>${escapeHtml(drill.label)}</span><span class="label">${drill.questions} Qs</span></li>`).join('')}</ol>
        <a class="button button--primary ear-start" href="#/ear/workout">Start the workout</a>
      </section>
      <section class="panel"><h2 class="panel__title">Confusion duels</h2>
        ${duels.length ? `<ul class="pattern-list">${duels.map((pair) => `<li><span>${escapeHtml(pair.expected)} heard as ${escapeHtml(pair.heard)}</span><span class="mono">${pair.count}/${pair.of}</span><a class="button" href="#/ear/duel/${pair.exercise}/${encodeURIComponent(pair.expected)}~${encodeURIComponent(pair.heard)}">Duel</a></li>`).join('')}</ul>` : '<p class="progress-empty">When you mix up two answers three times, a two-choice duel appears here to sort them out.</p>'}
      </section>
    </div>
    <h2 class="section-label">The eight games</h2>
    <div class="ear-games">${EAR_EXERCISES.map((exercise, index) => renderGameTile(state, exercise, index)).join('')}</div>
    ${renderEarMap(state)}
    ${renderTimbres()}`;
  bindTimbres();
}

// A cover tile for one game: artwork frame, title, level and stars.
function renderGameTile(state, exercise, index) {
  const level = unlockedLevel(state.ear.results, exercise.id, exercise.levels);
  const stars = levelStats(state.ear.results, exercise.id, level).stars;
  return `
    <a class="ear-game" href="#/ear/${exercise.id}">
      ${renderArtPlaceholder('cover', exercise.title, `cover:${exercise.id}`)}
      <span class="ear-game__number label">${String(index + 1).padStart(2, '0')}</span>
      <span class="ear-game__title">${escapeHtml(exercise.title)}</span>
      <span class="ear-game__blurb">${escapeHtml(exercise.blurb)}</span>
      <span class="label">Level ${level} of ${exercise.levels} · ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>
    </a>`;
}

// The ear map: for intervals and chord types, how often each answer was given.
function renderEarMap(state) {
  const grids = ['intervals', 'chord-quality', 'scale-degrees']
    .map((exercise) => ({ exercise, grid: confusionGrid(state.ear.results, exercise) }))
    .filter(({ grid }) => grid.rows.length > 0);
  if (grids.length === 0) return '';
  return `
    <section class="panel ear-map"><h2 class="panel__title">Ear map</h2>
      <p class="progress-empty">Each row is what played; each column is what you heard. The diagonal is right.</p>
      ${grids.map(({ exercise, grid }) => `
        <h3 class="label ear-map__title">${escapeHtml(getExercise(exercise).title)}</h3>
        <div class="ear-map__scroll"><table class="ear-map__grid">
          <thead><tr><th scope="col">played ↓ heard →</th>${grid.keys.map((key) => `<th scope="col">${escapeHtml(key)}</th>`).join('')}</tr></thead>
          <tbody>${grid.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.expected)}</th>${grid.keys.map((key) => {
            const count = row.cells[key] || 0;
            const share = count / row.total;
            const kind = count === 0 ? '' : key === row.expected ? ' ear-map__cell--right' : ' ear-map__cell--mixed';
            return `<td class="ear-map__cell${kind}" style="--share:${share.toFixed(2)}">${count ? `${Math.round(share * 100)}%` : ''}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table></div>`).join('')}
    </section>`;
}

// Chips for which sounds the games rotate through.
function renderTimbres() {
  const enabled = getSettings().earTimbres || Object.keys(TIMBRES);
  return `
    <section class="panel settings-group"><h2 class="panel__title">Sounds</h2>
      <p class="progress-empty">The same questions in different sounds, so your ear learns the music rather than the instrument.</p>
      <div class="chip-row">${Object.entries(TIMBRES).map(([id, name]) => `<button class="chip" data-timbre="${id}" aria-pressed="${enabled.includes(id)}">${name}</button>`).join('')}</div>
    </section>`;
}

// Turns a timbre on or off (at least one stays on).
function bindTimbres() {
  page().querySelectorAll('[data-timbre]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const enabled = new Set(getSettings().earTimbres || Object.keys(TIMBRES));
      if (enabled.has(chip.dataset.timbre)) enabled.delete(chip.dataset.timbre);
      else enabled.add(chip.dataset.timbre);
      if (enabled.size === 0) return;
      updateSettings({ earTimbres: [...enabled] });
      renderOverview();
    });
  });
}

// ─── One game ───

// A game at a chosen level, with level keys for every level you have unlocked.
function renderGame(id) {
  let exercise;
  try {
    exercise = getExercise(id);
  } catch {
    navigate('#/ear');
    return;
  }
  const results = getState().ear.results;
  const unlocked = unlockedLevel(results, exercise.id, exercise.levels);
  const level = Math.min(levelChoice.get(id) || unlocked, unlocked);
  page().innerHTML = `
    <header class="page-head">
      <a class="back-link" href="#/ear">← Ear training</a>
      <div class="section-head">
        <span class="section-head__kicker">Ear · game ${EAR_EXERCISES.indexOf(exercise) + 1} of 8</span>
        <h1 class="section-head__title section-head__title--hero">${escapeHtml(exercise.title)}</h1>
        <p class="section-head__lead">${escapeHtml(exercise.blurb)} Four stars at a level opens the next one.</p>
      </div>
      <div class="chip-row" role="group" aria-label="Level">
        ${Array.from({ length: exercise.levels }, (_, index) => index + 1).map((number) => {
          const stars = levelStats(results, exercise.id, number).stars;
          return `<button class="chip" data-level="${number}" aria-pressed="${number === level}" ${number > unlocked ? 'disabled' : ''}>Level ${number}${number <= unlocked ? ` · ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}` : ' · locked'}</button>`;
        }).join('')}
      </div>
    </header>
    <section class="panel" data-quiz></section>`;
  page().querySelectorAll('[data-level]').forEach((chip) => {
    chip.addEventListener('click', () => { levelChoice.set(id, Number(chip.dataset.level)); renderGame(id); });
  });
  mountEarQuiz(page().querySelector('[data-quiz]'), {
    drills: [{ exercise: exercise.id, level, pool: null, questions: GAME_QUESTIONS }],
    onFinish: () => addAgainButton(() => renderGame(id)),
  });
}

// ─── Workout and duels ───

// The daily workout.
function renderWorkout() {
  const drills = buildWorkout(getState());
  page().innerHTML = `
    <header class="page-head">
      <a class="back-link" href="#/ear">← Ear training</a>
      <div class="section-head">
        <span class="section-head__kicker">Ear · daily workout</span>
        <h1 class="section-head__title section-head__title--hero">Workout</h1>
        <p class="section-head__lead">${drills.map((drill) => escapeHtml(drill.label)).join(' · ')}</p>
      </div>
    </header>
    <section class="panel" data-quiz></section>`;
  mountEarQuiz(page().querySelector('[data-quiz]'), { drills, onFinish: () => addAgainButton(() => navigate('#/ear')) });
}

// A duel between two answers you keep mixing up.
function renderDuel(exerciseId, pool) {
  const [expected, heard] = pool.map(decodeURIComponent);
  const drill = duelDrill(getState().ear.results, { exercise: exerciseId, expected, heard });
  page().innerHTML = `
    <header class="page-head">
      <a class="back-link" href="#/ear">← Ear training</a>
      <div class="section-head">
        <span class="section-head__kicker">Ear · confusion duel</span>
        <h1 class="section-head__title section-head__title--hero">${escapeHtml(expected)} vs ${escapeHtml(heard)}</h1>
        <p class="section-head__lead">Only these two answers, again and again, until your ear separates them.</p>
      </div>
    </header>
    <section class="panel" data-quiz></section>`;
  mountEarQuiz(page().querySelector('[data-quiz]'), { drills: [drill], onFinish: () => addAgainButton(() => renderDuel(exerciseId, pool)) });
}

// After a quiz: a key to go again.
function addAgainButton(again) {
  const quizPanel = page().querySelector('[data-quiz]');
  if (!quizPanel) return;
  const button = document.createElement('button');
  button.className = 'button button--primary';
  button.textContent = 'Go again';
  button.addEventListener('click', again);
  quizPanel.append(button);
}

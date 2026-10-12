// The Practice page: metronome, practice timer (logs minutes when stopped),
// chord transition drills (run with the metronome's chord-change mode) and finger exercises.
// Phase 4 rebuilds this page around measured practice (TEMPO_PLAN.md section 6).

import { TRANSITION_DRILLS } from '../data/progressions.js';
import { FINGER_EXERCISES } from '../data/exercises.js';
import { updateState, makeId } from '../state/storage.js';
import { renderGreeting } from '../components/header.js';
import {
  renderMetronomePanel,
  bindMetronomePanel,
  startChordDrill,
  handleMetronomeKey,
} from '../components/metronome-panel.js';
import { formatClock } from '../utils/time.js';

// Practice timer state. Kept outside the page so it keeps counting on other pages.
const timer = {
  seconds: 0,
  intervalId: null,
};

document.addEventListener('keydown', (event) => {
  if (isPracticePageOpen()) handleMetronomeKey(event);
});

// ─── Rendering ───

// Draws the Practice page and connects its buttons.
export function renderPracticePage() {
  renderGreeting();
  const page = document.getElementById('pg-practice');
  page.innerHTML = `
    ${renderMetronomePanel()}
    ${renderTimerCard()}
    ${renderDrillsCard()}
    ${renderExercisesCard()}`;
  bindEvents(page);
}

// Returns true while the Practice page is the one on screen.
function isPracticePageOpen() {
  return document.getElementById('pg-practice').classList.contains('on');
}

// Returns the practice timer card.
function renderTimerCard() {
  const running = timer.intervalId !== null;
  return `
    <div class="card"><div class="card-t"><span class="dot" style="background:var(--green)"></span>Practice timer</div>
      <div style="text-align:center;margin:20px 0"><div style="font-family:var(--mono);font-size:42px;font-weight:500;letter-spacing:2px" id="tD">${formatClock(timer.seconds)}</div><div style="font-size:11px;color:var(--tx3);margin-top:4px">Logged when you stop</div></div>
      <button class="btn${running ? ' run' : ''}" id="timerToggle">${running ? 'Stop & log session' : 'Start practice session'}</button>
    </div>`;
}

// Returns the chord transition drills card. Each drill can run with the metronome.
function renderDrillsCard() {
  const drills = TRANSITION_DRILLS
    .map((drill, index) => `<div class="drill"><div class="dn">${drill.chords}</div><div class="ds">${drill.style}</div><button class="metro-small-btn drill-run" data-drill="${index}">Run with metronome</button></div>`)
    .join('');
  return `
    <div class="card"><div class="card-t"><span class="dot" style="background:var(--amber)"></span>Chord transition drills</div>
      <p style="font-size:12px;color:var(--tx3);margin-bottom:10px">Set metronome to 60 BPM. Switch chords every 4 beats. Increase as transitions smooth out.</p>
      <div class="drill-g">${drills}</div>
    </div>`;
}

// Returns the finger exercises card.
function renderExercisesCard() {
  const exercises = FINGER_EXERCISES
    .map((exercise) => `<div class="exercise"><div style="display:flex;justify-content:space-between"><div class="en">${exercise.name}</div><span style="font-size:10px;color:var(--tx3);font-family:var(--mono)">${exercise.duration}</span></div><div class="ed">${exercise.description}</div></div>`)
    .join('');
  return `
    <div class="card"><div class="card-t"><span class="dot" style="background:var(--purple)"></span>Finger exercises</div>
      ${exercises}
    </div>`;
}

// ─── Events ───

// Connects the metronome, the drill buttons and the timer button.
function bindEvents(page) {
  bindMetronomePanel(page, renderPracticePage);
  page.querySelectorAll('[data-drill]').forEach((button) => {
    button.addEventListener('click', () => {
      const drill = TRANSITION_DRILLS[Number(button.dataset.drill)];
      startChordDrill(drill.chords.split('→').map((chord) => chord.trim()), 4);
    });
  });
  page.querySelector('#timerToggle').addEventListener('click', toggleTimer);
}

// ─── Practice timer ───

// Starts the timer, or stops it and logs the session (at least 1 minute).
function toggleTimer() {
  if (timer.intervalId !== null) {
    stopTimerAndLog();
  } else {
    timer.intervalId = setInterval(tickTimer, 1000);
  }
  renderPracticePage();
}

// Adds one second and updates the clock if it is on screen.
function tickTimer() {
  timer.seconds++;
  const display = document.getElementById('tD');
  if (display) display.textContent = formatClock(timer.seconds);
}

// Stops the timer, saves the session in whole minutes and resets the clock.
function stopTimerAndLog() {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  const end = new Date();
  const start = new Date(end.getTime() - timer.seconds * 1000);
  const minutes = Math.max(1, Math.round(timer.seconds / 60));
  updateState((state) => {
    state.sessions.push({ id: makeId(), start: start.toISOString(), end: end.toISOString(), minutes, blocks: [], stub: null });
  });
  timer.seconds = 0;
}

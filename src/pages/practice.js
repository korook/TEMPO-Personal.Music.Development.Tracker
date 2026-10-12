// The Practice page: metronome, practice timer (logs minutes when stopped),
// chord transition drills and finger exercises. Same behaviour as v1.

import { TRANSITION_DRILLS } from '../data/progressions.js';
import { FINGER_EXERCISES } from '../data/exercises.js';
import { updateState, makeId } from '../state/storage.js';
import { renderGreeting } from '../components/header.js';
import { formatClock } from '../utils/time.js';
import {
  getBpm,
  getBeat,
  isRunning,
  toggleMetronome,
  setBpm,
  adjustBpm,
  setBeatListener,
} from '../audio/metronome.js';

// Practice timer state. Kept outside the page so it keeps counting on other pages.
const timer = {
  seconds: 0,
  intervalId: null,
};

setBeatListener(showBeat);

// ─── Rendering ───

// Draws the Practice page and connects its buttons.
export function renderPracticePage() {
  renderGreeting();
  const page = document.getElementById('pg-practice');
  page.innerHTML = `
    ${renderMetronomeCard()}
    ${renderTimerCard()}
    ${renderDrillsCard()}
    ${renderExercisesCard()}`;
  bindEvents(page);
}

// Returns the metronome card: BPM buttons, slider, 4 beat dots and start/stop.
function renderMetronomeCard() {
  const running = isRunning();
  const beatDots = [0, 1, 2, 3]
    .map((beat) => `<div class="bd${getBeat() === beat && running ? ' on' : ''}"></div>`)
    .join('');
  return `
    <div class="card"><div class="card-t"><span class="dot"></span>Metronome</div>
      <div class="bpm-row"><button class="bpm-btn" data-bpm-step="-5">−</button><div class="bpm-d"><div class="bpm-n" id="bN">${getBpm()}</div><div class="bpm-l">BPM</div></div><button class="bpm-btn" data-bpm-step="5">+</button><input type="range" class="bpm-s" id="bpmSlider" min="40" max="200" value="${getBpm()}" step="5"></div>
      <div class="bdots" id="bDots">${beatDots}</div>
      <button class="btn${running ? ' run' : ''}" id="metronomeToggle">${running ? 'Stop' : 'Start metronome'}</button>
    </div>`;
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

// Returns the chord transition drills card.
function renderDrillsCard() {
  const drills = TRANSITION_DRILLS
    .map((drill) => `<div class="drill"><div class="dn">${drill.chords}</div><div class="ds">${drill.style}</div></div>`)
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

// ─── Live updates ───

// Lights up the dot for the beat that just sounded (beat 1 gets the stronger style).
function showBeat(beat) {
  document.querySelectorAll('.bd').forEach((dot, index) => {
    dot.classList.remove('on', 'down');
    if (index === beat) dot.classList.add(beat === 0 ? 'down' : 'on');
  });
}

// Writes the current BPM into the big number.
function showBpm() {
  const display = document.getElementById('bN');
  if (display) display.textContent = getBpm();
}

// ─── Events ───

// Connects the metronome controls and the timer button.
function bindEvents(page) {
  page.querySelectorAll('[data-bpm-step]').forEach((button) => {
    button.addEventListener('click', () => {
      adjustBpm(Number(button.dataset.bpmStep));
      showBpm();
    });
  });
  page.querySelector('#bpmSlider').addEventListener('input', (event) => {
    setBpm(Number(event.target.value));
    showBpm();
  });
  page.querySelector('#metronomeToggle').addEventListener('click', () => {
    toggleMetronome();
    renderPracticePage();
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

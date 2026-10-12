// The Dashboard page (becomes "Today" in Phase 4): metric tiles, weekly chart,
// skill radar, chord mastery grid and quick actions. Same output as v1.

import { CHORDS_V1 } from '../data/chords-v1.js';
import { loadSessions, loadChordProgress } from '../state/storage.js';
import { totalMinutes, weeklyMinutes, countStreak } from '../practice/history.js';
import { renderGreeting } from '../components/header.js';
import { renderWeeklyChart, renderSkillRadar } from '../components/charts.js';
import { navigate } from '../router.js';
import { selectChord } from './chords.js';

// ─── Rendering ───

// Draws the whole Dashboard page from the stored sessions and chord progress.
export function renderTodayPage() {
  renderGreeting();
  const sessions = loadSessions();
  const progress = loadChordProgress();

  const page = document.getElementById('pg-dashboard');
  page.innerHTML = `
    ${renderMetricTiles(sessions, progress)}
    <div class="two" style="margin-bottom:14px">
      <div class="card"><div class="card-t"><span class="dot"></span>Weekly practice</div><div class="chart-box"><canvas id="chW"></canvas></div><div class="legend"><span><i style="background:var(--accent)"></i>Minutes</span></div></div>
      <div class="card"><div class="card-t"><span class="dot" style="background:var(--blue)"></span>Skill radar</div><div class="chart-box"><canvas id="chR"></canvas></div></div>
    </div>
    <div class="sec">Chord mastery</div>
    <div class="mg">${renderMasteryGrid(progress)}</div>
    <div class="sec">Quick actions</div>
    ${renderQuickActions()}`;

  bindEvents(page);
  renderWeeklyChart(sessions);
  renderSkillRadar(progress);
}

// Returns the four tiles: total minutes, streak, chords learned and this week's minutes.
function renderMetricTiles(sessions, progress) {
  const total = totalMinutes(sessions);
  const streak = countStreak(sessions);
  const chordCount = Object.keys(CHORDS_V1).length;
  const learned = Object.values(progress).filter((value) => value >= 50).length;
  const thisWeek = weeklyMinutes(sessions);

  return `
    <div class="metrics">
      <div class="met"><div class="ml">Total practice</div><div class="mv">${total}<span style="font-size:13px;color:var(--tx3)">m</span></div><div class="ms">${(total / 60).toFixed(1)} hours</div></div>
      <div class="met"><div class="ml">Streak</div><div class="mv" style="color:var(--green)">${streak}<span style="font-size:13px;color:var(--tx3)">d</span></div><div class="ms">${streak > 0 ? 'Keep going!' : 'Start today!'}</div></div>
      <div class="met"><div class="ml">Chords learned</div><div class="mv" style="color:var(--blue)">${learned}<span style="font-size:13px;color:var(--tx3)">/${chordCount}</span></div><div class="ms">${Math.round(learned / chordCount * 100)}% complete</div></div>
      <div class="met"><div class="ml">This week</div><div class="mv" style="color:var(--amber)">${thisWeek}<span style="font-size:13px;color:var(--tx3)">m</span></div><div class="ms">${thisWeek >= 60 ? 'On track!' : 'Aim for 60m/wk'}</div></div>
    </div>`;
}

// Returns one square per chord, filled and coloured by its self-rated %.
function renderMasteryGrid(progress) {
  return Object.keys(CHORDS_V1).map((chordKey) => {
    const percent = progress[chordKey] || 0;
    const colour = percent >= 80 ? 'var(--green)' : percent >= 40 ? 'var(--amber)' : percent >= 10 ? 'var(--blue)' : 'var(--bd2)';
    return `<div class="mc" data-chord="${chordKey}"><div class="mb" style="border-color:${colour}"><div class="mfill" style="height:${percent}%;background:${colour}"></div>${chordKey}</div><div class="mpct">${percent}%</div></div>`;
  }).join('');
}

// Returns the three shortcut tiles to Practice, Guitar and Progress.
function renderQuickActions() {
  return `
    <div class="sg">
      <div class="sug" style="background:rgba(232,92,58,.08)" data-go="practice"><div class="st" style="color:var(--accent)">Start practice</div><div class="sd" style="color:var(--accent)">Timer + metronome</div></div>
      <div class="sug" style="background:rgba(74,143,232,.08)" data-go="guitar"><div class="st" style="color:var(--blue)">Chord library</div><div class="sd" style="color:var(--blue)">16 chords with diagrams</div></div>
      <div class="sug" style="background:rgba(61,186,122,.08)" data-go="progress"><div class="st" style="color:var(--green)">View progress</div><div class="sd" style="color:var(--green)">Charts and history</div></div>
    </div>`;
}

// ─── Events ───

// Makes mastery squares open that chord on the Guitar page, and quick actions open their page.
function bindEvents(page) {
  page.querySelectorAll('[data-chord]').forEach((cell) => {
    cell.addEventListener('click', () => {
      selectChord(cell.dataset.chord);
      navigate('guitar');
    });
  });
  page.querySelectorAll('[data-go]').forEach((tile) => {
    tile.addEventListener('click', () => navigate(tile.dataset.go));
  });
}

// The Progress page: 28-day heatmap, cumulative minutes, chord type doughnut,
// mastery bars and the session log. Same output as v1.

import { CHORDS_V1 } from '../data/chords-v1.js';
import { getState, updateState } from '../state/storage.js';
import { loadChordProgress } from '../state/legacy-ratings.js';
import { minutesOnDay } from '../practice/history.js';
import { renderGreeting } from '../components/header.js';
import { renderCumulativeChart, renderChordTypeDonut } from '../components/charts.js';
import { daysBefore } from '../utils/time.js';

// ─── Rendering ───

// Draws the whole Progress page from the stored sessions and chord progress.
export function renderProgressPage() {
  renderGreeting();
  const page = document.getElementById('pg-progress');
  const sessions = getState().sessions;
  const progress = loadChordProgress();

  page.innerHTML = `
    ${renderHeatmapCard(sessions)}
    <div class="two-eq" style="margin-bottom:14px">
      <div class="card"><div class="card-t"><span class="dot" style="background:var(--green)"></span>Cumulative</div><div class="chart-box"><canvas id="chCu"></canvas></div></div>
      <div class="card"><div class="card-t"><span class="dot" style="background:var(--blue)"></span>Chord types</div><div class="chart-box"><canvas id="chDo"></canvas></div><div class="legend"><span><i style="background:var(--bronze)"></i>Major</span><span><i style="background:var(--sonic)"></i>Minor</span><span><i style="background:var(--verdigris)"></i>7th</span></div></div>
    </div>
    ${renderMasteryCard(progress)}
    ${renderSessionLogCard(sessions)}`;

  bindEvents(page);
  renderCumulativeChart(sessions);
  renderChordTypeDonut(progress);
}

// Returns the 28-day heatmap: one square per day, brighter for more minutes.
function renderHeatmapCard(sessions) {
  const cells = Array.from({ length: 28 }).map((_, index) => {
    const day = daysBefore(new Date(), 27 - index);
    const minutes = minutesOnDay(sessions, day);
    const opacity = minutes === 0 ? 0.06 : Math.min(1, 0.15 + minutes / 45);
    const label = `${day.toLocaleDateString('en', { month: 'short', day: 'numeric' })}:${minutes}m`;
    return `<div class="hc" data-t="${label}" style="background:var(--accent);opacity:${opacity}"></div>`;
  }).join('');

  return `
    <div class="card"><div class="card-t"><span class="dot"></span>Last 28 days</div>
      <div class="hm">${cells}</div>
      <div class="legend"><span><i style="background:var(--accent);opacity:.06"></i>None</span><span><i style="background:var(--accent);opacity:.3"></i>Light</span><span><i style="background:var(--accent);opacity:.6"></i>Medium</span><span><i style="background:var(--accent);opacity:1"></i>Heavy</span></div>
    </div>`;
}

// Returns one progress bar per chord with its self-rated %.
function renderMasteryCard(progress) {
  const rows = Object.entries(CHORDS_V1).map(([chordKey, chord]) => {
    const percent = progress[chordKey] || 0;
    const colour = percent >= 80 ? 'var(--verdigris)' : percent >= 40 ? 'var(--bronze)' : percent >= 10 ? 'var(--sonic)' : 'var(--line)';
    return `<div class="pi"><div class="pbadge" style="background:${colour}">${chordKey}</div><div class="pbw"><div class="pbl"><span>${chord.name} ${chord.type}</span><span style="font-family:var(--mono)">${percent}%</span></div><div class="pb"><div class="pf" style="width:${percent}%;background:${colour}"></div></div></div></div>`;
  }).join('');

  return `
    <div class="card"><div class="card-t"><span class="dot" style="background:var(--amber)"></span>Chord mastery</div>
      ${rows}
    </div>`;
}

// Returns the last 30 sessions, newest first, with a "Clear history" button.
function renderSessionLogCard(sessions) {
  const log = sessions.length === 0
    ? '<div style="padding:24px;text-align:center;color:var(--tx3)">No sessions yet. Start practicing!</div>'
    : sessions.slice().reverse().slice(0, 30).map((session) => {
      const date = new Date(session.end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<div class="sr"><span class="sd">${date}</span><span class="sm">${session.minutes}m</span><span style="color:var(--tx3)">Practice session</span></div>`;
    }).join('');

  const clearButton = sessions.length > 0
    ? '<div style="margin-top:10px;text-align:right"><button class="btn" id="clearHistory" style="width:auto;display:inline-block;padding:7px 14px;font-size:11px;color:var(--accent)">Clear history</button></div>'
    : '';

  return `
    <div class="card"><div class="card-t"><span class="dot" style="background:var(--purple)"></span>Session log</div>
      <div class="slog">${log}</div>
      ${clearButton}
    </div>`;
}

// ─── Events ───

// Connects the "Clear history" button, which asks for confirmation first.
function bindEvents(page) {
  const clearButton = page.querySelector('#clearHistory');
  if (!clearButton) return;
  clearButton.addEventListener('click', () => {
    if (confirm('Clear all sessions?')) {
      updateState((state) => {
        state.sessions = [];
      });
      renderProgressPage();
    }
  });
}

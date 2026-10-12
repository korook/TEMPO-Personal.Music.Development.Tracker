// The Progress page: 28-day heatmap, cumulative minutes, mistake patterns (this week vs
// last week), clean rate per chord shape, and the session log (receipts for new sessions).
// The groove disc, personal-best lines and milestones come later in Phase 4.

import { getState, updateState } from '../state/storage.js';
import { minutesOnDay } from '../practice/history.js';
import { cleanRate } from '../practice/measures.js';
import { describeMistake } from '../data/mistake-tips.js';
import { renderGreeting } from '../components/header.js';
import { renderStubStack } from '../components/stub.js';
import { renderCumulativeChart } from '../components/charts.js';
import { daysBefore } from '../utils/time.js';
import { escapeHtml } from '../utils/html.js';

const DAY_MS = 864e5;

// ─── Rendering ───

// Draws the whole Progress page from the saved practice data.
export function renderProgressPage() {
  renderGreeting();
  const page = document.getElementById('pg-progress');
  const state = getState();
  const sessions = state.sessions;

  page.innerHTML = `
    ${renderHeatmapCard(sessions)}
    <div class="two-eq" style="margin-bottom:14px">
      <div class="card"><div class="card-t"><span class="dot"></span>Total minutes, last 14 days</div><div class="chart-box"><canvas id="chCu"></canvas></div></div>
      <div class="card"><div class="card-t"><span class="dot"></span>Mistake patterns</div>${renderMistakePatterns(state)}</div>
    </div>
    ${renderCleanRateCard(state)}
    ${renderSessionLogCard(sessions)}`;

  bindEvents(page);
  renderCumulativeChart(sessions);
}

// The mistakes logged this week, most frequent first, next to last week's count.
function renderMistakePatterns(state) {
  const now = Date.now();
  const countTags = (fromDaysAgo, toDaysAgo) => {
    const counts = new Map();
    for (const rep of state.reps) {
      const age = (now - new Date(rep.at).getTime()) / DAY_MS;
      if (age < toDaysAgo || age >= fromDaysAgo || !Array.isArray(rep.mistakes)) continue;
      for (const tag of rep.mistakes) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return counts;
  };
  const thisWeek = countTags(7, 0);
  const lastWeek = countTags(14, 7);
  if (thisWeek.size === 0) {
    return '<p class="progress-empty">No mistakes logged this week. Tag buzzes and late changes during practice and the patterns show up here.</p>';
  }
  const rows = [...thisWeek.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => {
    const before = lastWeek.get(tag) || 0;
    const trend = before === 0 ? 'new this week' : count < before ? `down from ${before}` : count > before ? `up from ${before}` : 'same as last week';
    return `<li><span>${escapeHtml(describeMistake(tag))}</span><span class="mono">${count}×</span><span class="label">${trend}</span></li>`;
  }).join('');
  return `<ul class="pattern-list">${rows}</ul>`;
}

// One bar per practiced chord shape: its clean rate over the last 10 reps.
function renderCleanRateCard(state) {
  const shapes = Object.values(state.items)
    .filter((item) => item.type === 'voicing')
    .map((item) => ({ item, ...cleanRate(state.reps, item.id) }))
    .filter((shape) => shape.total > 0)
    .sort((a, b) => b.rate - a.rate);
  const rows = shapes.length === 0
    ? '<p class="progress-empty">No chord shapes practiced yet. Start a session on the Practice page.</p>'
    : shapes.map(({ item, clean, total, rate }) => {
      const colour = rate >= 0.8 ? 'var(--verdigris)' : rate >= 0.5 ? 'var(--bronze)' : 'var(--shell)';
      return `<div class="pi"><div class="pbw"><div class="pbl"><span>${escapeHtml(item.label)}</span><span style="font-family:var(--mono)">${clean}/${total} clean</span></div><div class="pb"><div class="pf" style="width:${Math.round(rate * 100)}%;background:${colour}"></div></div></div></div>`;
    }).join('');
  return `
    <div class="card"><div class="card-t"><span class="dot"></span>Clean rate per shape · last 10 reps</div>
      ${rows}
    </div>`;
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

// The session log: the latest receipts, then a plain list of every session (newest first),
// with a "Clear history" button.
function renderSessionLogCard(sessions) {
  const receipts = sessions.filter((session) => session.stub).slice(-4).reverse().map((session) => session.stub);
  const log = sessions.length === 0
    ? '<p class="progress-empty">No sessions yet. Your first one prints a receipt here.</p>'
    : sessions.slice().reverse().slice(0, 30).map((session) => {
      const date = new Date(session.end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      const what = session.blocks && session.blocks.length ? session.blocks.map((block) => block.title).join(' · ') : 'Practice session';
      return `<div class="sr"><span class="sd">${date}</span><span class="sm">${session.minutes}m</span><span class="sr__what">${escapeHtml(what)}</span></div>`;
    }).join('');

  const clearButton = sessions.length > 0
    ? '<div class="slog__actions"><button class="button" id="clearHistory">Clear history</button></div>'
    : '';

  return `
    <div class="card"><div class="card-t"><span class="dot"></span>Session log</div>
      ${receipts.length ? renderStubStack(receipts) : ''}
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
    if (confirm('Clear every session from the log? Your chord reps and bests stay. This cannot be undone.')) {
      updateState((state) => {
        state.sessions = [];
      });
      renderProgressPage();
    }
  });
}

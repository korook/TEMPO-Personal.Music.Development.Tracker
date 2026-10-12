// The Progress page (TEMPO_PLAN.md 6.9). Hero: the groove disc of weekly minutes next to
// the latest receipts. Then personal bests over time, milestones, mistake patterns (this
// week vs last week), clean rate per chord shape, the 28-day heatmap, total minutes and
// the session log. Always compared against your own past, never an "ideal".

import { getState, updateState } from '../state/storage.js';
import { minutesOnDay } from '../practice/history.js';
import { cleanRate, repsFor, cleanBpmBest } from '../practice/measures.js';
import { milestoneBoard } from '../practice/milestones.js';
import { describeMistake } from '../data/mistake-tips.js';
import { renderGreeting } from '../components/header.js';
import { renderStubStack } from '../components/stub.js';
import { renderGrooveDisc, renderSparkline } from '../components/groove-disc.js';
import { renderPolaroid } from '../components/taped-card.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
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

  const receipts = sessions.filter((session) => session.stub).slice(-3).reverse().map((session) => session.stub);

  page.innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Progress</span>
        <h1 class="section-head__title section-head__title--hero">Progress</h1>
        <p class="section-head__lead">How your playing is moving, measured against your own past. There's no 100%: every best can be beaten.</p>
      </div>
    </header>
    <section class="progress-hero">
      ${renderGrooveDisc(sessions)}
      <div class="progress-hero__receipts">
        ${receipts.length ? renderStubStack(receipts) : '<p class="progress-empty">Your session receipts pile up here.</p>'}
      </div>
    </section>
    ${renderBestsCard(state)}
    ${renderMilestones(state)}
    <div class="split split--even">
      <section class="panel"><h2 class="panel__title">Mistake patterns</h2>${renderMistakePatterns(state)}</section>
      ${renderHeatmapCard(sessions)}
    </div>
    ${renderCleanRateCard(state)}
    <section class="panel"><h2 class="panel__title">Total minutes, last 14 days</h2><div class="chart-frame"><canvas id="chCu"></canvas></div></section>
    ${renderSessionLogCard(sessions)}`;

  bindEvents(page);
  renderCumulativeChart(sessions);
}

// Personal bests with their trend: change counts, clean tempos and form times.
function renderBestsCard(state) {
  const rows = [];
  for (const item of Object.values(state.items)) {
    if (item.type === 'pair') {
      const counts = repsFor(state.reps, item.id, 'changes').map((rep) => rep.count);
      if (counts.length) rows.push(bestRow(item.label, 'changes / min', Math.max(...counts), counts, false));
    } else if (item.type === 'progression' || item.type === 'exercise') {
      const tempos = repsFor(state.reps, item.id, 'bpm-pass').filter((rep) => rep.clean).map((rep) => rep.bpm);
      const best = cleanBpmBest(state.reps, item.id);
      if (best !== null) rows.push(bestRow(item.label, 'clean BPM (3 in a row)', best, tempos, false));
    } else if (item.type === 'voicing') {
      const times = repsFor(state.reps, item.id, 'form-time').map((rep) => Math.round(rep.ms / 100) / 10);
      if (times.length) rows.push(bestRow(item.label, 'seconds to form', Math.min(...times), times, true));
    }
  }
  return `
    <section class="panel"><h2 class="panel__title">Personal bests</h2>
      ${rows.length ? `<ul class="bests-list">${rows.join('')}</ul>` : '<p class="progress-empty">Bests appear after a one-minute changes test, three clean passes at a tempo, or a timed chord change.</p>'}
    </section>`;
}

// One personal-best row: item, metric, best value and its trend line.
function bestRow(label, metric, best, history, lowerIsBetter) {
  return `
    <li>
      <span class="bests-list__item">${escapeHtml(label)}<span class="label">${metric}</span></span>
      <span class="bests-list__value">${best}</span>
      ${renderSparkline(history, { lowerIsBetter, label: `${label} ${metric}: ${history.join(', ')}` })}
    </li>`;
}

// Milestones as polaroids: reached ones with their date, the rest showing what they need.
function renderMilestones(state) {
  const board = milestoneBoard(state);
  const reached = board.filter((milestone) => milestone.at).length;
  const polaroids = board.map((milestone, index) => `
    <div class="milestone${milestone.at ? '' : ' milestone--locked'}">
      ${renderPolaroid({
        pictureHtml: renderArtPlaceholder('stamp', milestone.title),
        caption: milestone.title,
        date: milestone.at ? new Date(milestone.at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : milestone.needs,
        index,
      })}
    </div>`).join('');
  return `
    <section class="milestones" aria-labelledby="milestones-title">
      <div class="root-row__head"><h2 class="root-row__title" id="milestones-title">Milestones</h2><span class="label">${reached} of ${board.length}</span></div>
      <div class="milestones__grid">${polaroids}</div>
    </section>`;
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
      return `<div class="rate-row"><div class="rate-row__head"><span>${escapeHtml(item.label)}</span><span class="mono">${clean}/${total} clean</span></div><div class="rate-bar"><div class="rate-bar__fill" style="width:${Math.round(rate * 100)}%;background:${colour}"></div></div></div>`;
    }).join('');
  return `
    <section class="panel"><h2 class="panel__title">Clean rate per shape · last 10 reps</h2>
      ${rows}
    </section>`;
}

// Returns the 28-day heatmap: one square per day, brighter for more minutes.
function renderHeatmapCard(sessions) {
  const cells = Array.from({ length: 28 }).map((_, index) => {
    const day = daysBefore(new Date(), 27 - index);
    const minutes = minutesOnDay(sessions, day);
    const opacity = minutes === 0 ? 0.08 : Math.min(1, 0.4 + minutes / 60);
    const label = `${day.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${minutes} min`;
    return `<div class="heatmap__day" title="${label}" style="opacity:${opacity}"><span class="visually-hidden">${label}</span></div>`;
  }).join('');

  return `
    <section class="panel"><h2 class="panel__title">Last 28 days</h2>
      <div class="heatmap">${cells}</div>
      <div class="heatmap__legend label"><span><i style="opacity:.08"></i>none</span><span><i style="opacity:.45"></i>a few min</span><span><i style="opacity:.75"></i>20 min</span><span><i style="opacity:1"></i>40 min +</span></div>
    </section>`;
}

// The session log: the latest receipts, then a plain list of every session (newest first),
// with a "Clear history" button.
function renderSessionLogCard(sessions) {
  const log = sessions.length === 0
    ? '<p class="progress-empty">No sessions yet. Your first one prints a receipt here.</p>'
    : sessions.slice().reverse().slice(0, 30).map((session) => {
      const date = new Date(session.end).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      const what = session.blocks && session.blocks.length ? session.blocks.map((block) => block.title).join(' · ') : 'Practice session';
      return `<div class="session-log__row"><span class="session-log__date">${date}</span><span class="mono">${session.minutes}m</span><span class="session-log__what">${escapeHtml(what)}</span></div>`;
    }).join('');

  const clearButton = sessions.length > 0
    ? '<div class="session-log__actions"><button class="button" id="clearHistory">Clear history</button></div>'
    : '';

  return `
    <section class="panel"><h2 class="panel__title">Session log</h2>
      <div class="session-log">${log}</div>
      ${clearButton}
    </section>`;
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

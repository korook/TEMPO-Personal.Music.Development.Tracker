// The Progress page (TEMPO_PLAN.md 6.9). Hero: the groove disc of weekly minutes next to
// the latest receipts. Then personal bests over time, milestones, mistake patterns (this
// week vs last week), the 28-day heatmap, where buzzes and mutes happen on the neck (and
// which finger causes most), clean rate per chord shape and the session log. Minutes are
// shown once: the groove disc by week and the heatmap by day (17.4, item 6). Always
// compared against your own past, never an "ideal".

import { getState, updateState } from '../state/storage.js';
import { minutesOnDay } from '../practice/history.js';
import { cleanRate, repsFor, cleanBpmBest } from '../practice/measures.js';
import { milestoneBoard } from '../practice/milestones.js';
import { describeMistake, parseMistake, TAG_STRINGS } from '../data/mistake-tips.js';
import { voicingForItem } from '../practice/items.js';
import { fingerForMistake, FINGER_NAMES } from '../practice/finger-tips.js';
import { renderNeckMarks } from '../components/neck.js';
import { getSettings } from '../state/settings.js';
import { renderGreeting } from '../components/header.js';
import { renderStubStack } from '../components/stub.js';
import { renderGrooveDisc, renderSparkline } from '../components/groove-disc.js';
import { renderPolaroid } from '../components/taped-card.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
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
        ${receipts.length ? renderStubStack(receipts) : renderNoReceipts()}
      </div>
    </section>
    ${renderBestsCard(state)}
    ${renderMilestones(state)}
    <div class="split split--even">
      <section class="panel"><h2 class="panel__title">Mistake patterns</h2>${renderMistakePatterns(state)}</section>
      ${renderHeatmapCard(sessions)}
    </div>
    ${renderBuzzMap(state)}
    ${renderCleanRateCard(state)}
    ${renderSessionLogCard(sessions)}`;

  bindEvents(page);
}

// The empty receipt pile: an illustration (pixel stand-in until the art exists) and a line.
function renderNoReceipts() {
  return `
    <div class="empty-state empty-state--receipts">
      ${renderArtPlaceholder('character', 'No receipts yet', 'character:empty-receipts')}
      <div>
        <h2 class="empty-state__title">No receipts yet</h2>
        <p class="empty-state__text">Finish a practice session and its receipt prints here, with your minutes, bests and the next thing to try.</p>
      </div>
    </div>`;
}

// Where buzzes and mutes happen on the neck over the last 28 days, and which finger
// causes most of them (17.4, item 4). Worked out from each shape's fingering.
function renderBuzzMap(state) {
  const since = Date.now() - 28 * DAY_MS;
  const spots = new Map();
  const fingers = new Map();
  let total = 0;
  for (const rep of state.reps) {
    if (!Array.isArray(rep.mistakes) || new Date(rep.at).getTime() < since) continue;
    const item = state.items[rep.itemId];
    const voicing = item && item.type === 'voicing' ? voicingForItem(item) : null;
    if (!voicing) continue;
    for (const tag of rep.mistakes) {
      const { kind, string } = parseMistake(tag);
      const index = TAG_STRINGS.indexOf(string);
      if ((kind !== 'buzz' && kind !== 'mute') || index < 0 || voicing.frets[index] === null) continue;
      const key = `${index}:${voicing.frets[index]}`;
      spots.set(key, (spots.get(key) || 0) + 1);
      const finger = fingerForMistake(tag, voicing);
      if (finger) fingers.set(finger, (fingers.get(finger) || 0) + 1);
      total++;
    }
  }
  const title = '<h2 class="panel__title">Where it buzzes · last 28 days</h2>';
  if (total === 0) {
    return `<section class="panel">${title}<p class="progress-empty">Tag a buzzing or muted string after a rep and the spot shows up on the neck here, with the finger that causes it.</p></section>`;
  }
  const most = Math.max(...spots.values());
  const marks = [...spots.entries()].map(([key, count]) => {
    const [string, fret] = key.split(':').map(Number);
    return { string, fret, label: String(count), kind: count >= most / 2 ? 'wrong' : 'active' };
  });
  const fingerRows = [...fingers.entries()].sort((a, b) => b[1] - a[1])
    .map(([finger, count]) => `<li><span>${FINGER_NAMES[finger]} finger</span><span class="mono">${count}×</span></li>`).join('');
  return `
    <section class="panel buzz-map">${title}
      ${renderNeckMarks(marks, { leftHanded: getSettings().leftHanded, description: `Buzzes and mutes on the neck: ${total} in the last 28 days` })}
      ${fingerRows ? `<h3 class="buzz-map__subtitle label">Which finger causes most</h3><ul class="pattern-list">${fingerRows}</ul>` : ''}
    </section>`;
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
        pictureHtml: renderArtPlaceholder('stamp', milestone.title, `stamp:${milestone.id}`),
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

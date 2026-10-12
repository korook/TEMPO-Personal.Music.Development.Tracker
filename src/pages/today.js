// The Today page: what to practice now and why. A ticker of today's openings; the hero
// (an artwork frame next to tonight's setlist); four numbers from real practice data; the
// week's minutes; the next steps; and the first chords with their clean rate.

import { CHORDS_V1 } from '../data/chords-v1.js';
import { getState, updateState, needsExportReminder } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { totalMinutes, weeklyMinutes, countStreak } from '../practice/history.js';
import { generateOpenings } from '../practice/openings.js';
import { buildSetlist, blockLabel } from '../practice/session.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
import { cleanRate } from '../practice/measures.js';
import { renderGreeting } from '../components/header.js';
import { renderTicker } from '../components/ticker.js';
import { renderWeeklyChart } from '../components/charts.js';
import { navigate, chordLink } from '../router.js';
import { escapeHtml } from '../utils/html.js';

const NEXT_STEPS_SHOWN = 4;

// ─── Rendering ───

// Draws the whole page from the saved practice data.
export function renderTodayPage() {
  const state = getState();
  const openings = generateOpenings(state);

  const page = document.getElementById('pg-dashboard');
  page.innerHTML = `
    ${renderTicker(openings.slice(0, 8).map((opening) => opening.short))}
    <div class="greeting" id="greetBox"></div>
    ${renderRatingsNotice(state)}
    ${needsExportReminder(state) ? '<p class="storage-notice" role="status">It\'s been over 30 days since your last backup. <a href="#/settings">Export one in Settings</a> so your practice history is safe.</p>' : ''}
    ${renderHero(state)}
    ${renderMetricTiles(state)}
    <div class="split">
      <section class="panel"><h2 class="panel__title">Last 7 days</h2><div class="chart-frame"><canvas id="chW"></canvas></div><p class="label">Minutes per day</p></section>
      <section class="panel next-steps"><h2 class="panel__title">Next steps</h2>${renderNextSteps(openings)}</section>
    </div>
    <h2 class="section-label">Your chords · clean rate</h2>
    <div class="chord-rates">${renderChordGrid(state)}</div>
`;

  renderGreeting();
  bindEvents(page);
  renderWeeklyChart(state.sessions);
}

// Returns the four numbers: total time, streak, shapes practiced and this week's minutes.
function renderMetricTiles(state) {
  const total = totalMinutes(state.sessions);
  const streak = countStreak(state.sessions, new Date(), getSettings().restDaysPerWeek);
  const shapes = practicedShapes(state);
  const cleanShapes = shapes.filter((shape) => shape.rate !== null && shape.rate >= 0.8).length;
  const thisWeek = weeklyMinutes(state.sessions);
  const streakNote = streak.practicedToday ? 'Played today' : streak.days > 0 ? 'Play today to keep it' : 'Start today';

  return `
    <div class="stat-grid">
      ${tile('Total practice', total, 'm', total >= 60 ? `${(total / 60).toFixed(1)} hours` : 'minutes so far')}
      ${tile('Streak', streak.days, 'd', streakNote)}
      ${tile('Shapes practiced', shapes.length, '', shapesNote(shapes.length, cleanShapes))}
      ${tile('This week', thisWeek, 'm', thisWeek >= 60 ? 'Weekly 60 minutes reached' : `${60 - thisWeek}m to go for 60`)}
    </div>`;
}

// The line under "Shapes practiced".
function shapesNote(total, clean) {
  if (total === 0) return 'Add one from Chords';
  if (clean === 0) return 'None clean 8/10 yet';
  return `${clean} of ${total} clean 8/10 or better`;
}

// One number tile.
function tile(label, value, unit, note) {
  return `<div class="stat"><span class="stat__label">${label}</span><span class="stat__value">${value}<span class="stat__unit">${unit}</span></span><span class="stat__note">${note}</span></div>`;
}

// The top openings as a short list with a link to plan a session.
function renderNextSteps(openings) {
  const steps = openings.slice(0, NEXT_STEPS_SHOWN)
    .map((opening) => `<li><span class="label">${escapeHtml(opening.type)}</span><span>${escapeHtml(opening.text)}</span></li>`)
    .join('');
  return `<ol class="next-steps__list">${steps}</ol><button class="button button--primary" data-go="practice">Plan a session</button>`;
}

// One square per first chord, filled by the clean rate of its most-practiced shape.
function renderChordGrid(state) {
  const shapes = practicedShapes(state);
  return Object.keys(CHORDS_V1).map((chord) => {
    const shape = shapes.filter((candidate) => candidate.item.chord === chord).sort((a, b) => b.total - a.total)[0];
    const rate = shape ? shape.rate : null;
    const fill = rate === null ? 0 : Math.round(rate * 100);
    const label = rate === null ? '–' : `${shape.clean}/${shape.total}`;
    return `<a class="chord-rate" href="${chordLink(chord)}" aria-label="${chord}: ${rate === null ? 'not practiced yet' : `${label} clean`}"><span class="chord-rate__key"><span class="chord-rate__fill" style="height:${fill}%"></span><span class="chord-rate__name">${chord}</span></span><span class="chord-rate__value">${label}</span></a>`;
  }).join('');
}

// The hero: a frame for Baranay's artwork beside tonight's proposed setlist.
// The setlist is worked out on a copy, so looking at Today never changes saved data.
function renderHero(state) {
  const blocks = buildSetlist(structuredClone(state));
  const rows = blocks.map((block, index) => `
    <li><span class="label">${String(index + 1).padStart(2, '0')}</span><span class="today-setlist__kind">${escapeHtml(blockLabel(block))}</span><span>${escapeHtml(block.title)}</span><span class="label">${block.minutes ? `${block.minutes} min` : '–'}</span></li>`).join('');
  return `
    <section class="today-hero">
      <div class="today-hero__art">${renderArtPlaceholder('hero', 'Today')}</div>
      <div class="panel today-setlist">
        <div class="section-head">
          <span class="section-head__kicker">Tonight's setlist</span>
          <h1 class="section-head__title">Ready when you are</h1>
        </div>
        <ol class="today-setlist__list">${rows}</ol>
        <button class="button button--primary" data-go="practice">Start practice</button>
      </div>
    </section>`;
}

// The one-time note that the old self-rated chord percentages were not carried over.
function renderRatingsNotice(state) {
  const notice = state.meta.notices.chordRatingsDropped;
  if (!notice || notice.dismissed) return '';
  return `
    <div class="storage-notice ratings-notice" role="status">
      <span>Your old "+10%" chord ratings weren't carried over: they didn't measure anything. Your practice minutes were kept, and chords now get a clean rate from real reps.</span>
      <button class="button" data-dismiss-ratings>OK</button>
    </div>`;
}

// ─── Data ───

// Every chord shape that has been practiced, with its clean rate: [{ item, clean, total, rate }].
function practicedShapes(state) {
  return Object.values(state.items)
    .filter((item) => item.type === 'voicing')
    .map((item) => ({ item, ...cleanRate(state.reps, item.id) }))
    .filter((shape) => shape.total > 0);
}

// ─── Events ───

// Quick actions, next steps and the notice.
function bindEvents(page) {
  page.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.go === 'chords' ? '#/chords/C' : button.dataset.go));
  });
  const dismiss = page.querySelector('[data-dismiss-ratings]');
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      updateState((state) => { state.meta.notices.chordRatingsDropped.dismissed = true; });
      renderTodayPage();
    });
  }
}

// The Today page: what to practice now and why (TEMPO_PLAN.md 17.4, item 2). One hero (the
// artwork beside tonight's setlist, with the only call to action); a ticker with the top three
// openings; one slim strip of numbers; and the chord shapes you have actually practised,
// with their clean rate and status. Minutes over time live on Progress.

import { getState, updateState, needsExportReminder } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { totalMinutes, weeklyMinutes, countStreak } from '../practice/history.js';
import { generateOpenings } from '../practice/openings.js';
import { buildSetlist, blockLabel } from '../practice/session.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
import { cleanRate } from '../practice/measures.js';
import { itemStatus } from '../practice/status.js';
import { renderGreeting } from '../components/header.js';
import { renderTicker } from '../components/ticker.js';
import { navigate, chordLink } from '../router.js';
import { escapeHtml } from '../utils/html.js';

const TICKER_OPENINGS = 3;

// ─── Rendering ───

// Draws the whole page from the saved practice data.
export function renderTodayPage() {
  const state = getState();
  const openings = generateOpenings(state);

  const page = document.getElementById('pg-dashboard');
  page.innerHTML = `
    ${renderTicker(openings.slice(0, TICKER_OPENINGS).map((opening) => opening.short))}
    <div class="greeting" id="greetBox"></div>
    ${renderRatingsNotice(state)}
    ${needsExportReminder(state) ? '<p class="storage-notice" role="status">It\'s been over 30 days since your last backup. <a href="#/settings">Export one in Settings</a> so your practice history is safe.</p>' : ''}
    ${renderHero(state)}
    ${renderStatsStrip(state)}
    ${renderYourShapes(state)}
`;

  renderGreeting();
  bindEvents(page);
}

// One slim line of numbers on a screen: total time, streak, this week and clean shapes.
function renderStatsStrip(state) {
  const total = totalMinutes(state.sessions);
  const streak = countStreak(state.sessions, new Date(), getSettings().restDaysPerWeek);
  const shapes = practicedShapes(state);
  const clean = shapes.filter((shape) => shape.rate >= 0.8).length;
  const thisWeek = weeklyMinutes(state.sessions);
  const streakText = streak.days === 0 ? 'no streak yet' : `${streak.days}-day streak${streak.practicedToday ? '' : ', play today to keep it'}`;
  const parts = [
    total >= 60 ? `${(total / 60).toFixed(1)} h played` : `${total} min played`,
    streakText,
    `${thisWeek} / 60 min this week`,
    shapes.length ? `${clean} of ${shapes.length} shape${shapes.length === 1 ? '' : 's'} clean` : 'no shapes measured yet',
  ];
  return `
    <p class="stats-strip" aria-label="Your numbers">
      ${parts.map((part) => `<span class="stats-strip__item">${escapeHtml(part)}</span>`).join('<span class="stats-strip__dot" aria-hidden="true"></span>')}
    </p>`;
}

// The chord shapes you have practised: clean rate, status and what the next status needs.
// Nothing shows until you have practised one.
function renderYourShapes(state) {
  const shapes = practicedShapes(state).sort((a, b) => b.total - a.total);
  if (!shapes.length) return '';
  const rows = shapes.map(({ item, clean, total }) => {
    const status = itemStatus(item, state.reps);
    return `
      <li class="your-shape">
        <a class="your-shape__name" href="${chordLink(item.chord)}">${escapeHtml(item.label)}</a>
        <span class="mono">${clean}/${total} clean</span>
        <span class="chip chip--picked">${status.label}</span>
        <span class="your-shape__next">${escapeHtml(status.next)}</span>
      </li>`;
  }).join('');
  return `
    <section class="panel your-shapes">
      <h2 class="panel__title">Your shapes</h2>
      <ul class="your-shapes__list">${rows}</ul>
    </section>`;
}

// The hero: a frame for Baranay's artwork beside tonight's proposed setlist.
// The setlist is worked out on a copy, so looking at Today never changes saved data.
function renderHero(state) {
  const blocks = buildSetlist(structuredClone(state));
  const rows = blocks.map((block, index) => `
    <li><span class="label">${String(index + 1).padStart(2, '0')}</span><span class="today-setlist__kind">${escapeHtml(blockLabel(block))}</span><span>${escapeHtml(block.title)}</span><span class="label">${block.minutes ? `${block.minutes} min` : '–'}</span></li>`).join('');
  return `
    <section class="today-hero">
      <div class="today-hero__art">${renderArtPlaceholder('hero', 'Today', 'hero:today')}</div>
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

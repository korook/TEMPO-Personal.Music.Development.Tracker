// The Today page: what to practice now and why. A ticker of today's openings, four numbers
// from real practice data, the week's minutes, the next steps, and the first chords with
// their clean rate. (The full Today hero with the setlist preview comes later in Phase 4.)

import { CHORDS_V1 } from '../data/chords-v1.js';
import { getState, updateState, needsExportReminder } from '../state/storage.js';
import { getSettings } from '../state/settings.js';
import { totalMinutes, weeklyMinutes, countStreak } from '../practice/history.js';
import { generateOpenings } from '../practice/openings.js';
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
    <div class="greet" id="greetBox"></div>
    ${renderRatingsNotice(state)}
    ${needsExportReminder(state) ? '<p class="storage-notice" role="status">It\'s been over 30 days since your last backup. <a href="#/settings">Export one in Settings</a> so your practice history is safe.</p>' : ''}
    ${renderMetricTiles(state)}
    <div class="two" style="margin-bottom:14px">
      <div class="card"><div class="card-t"><span class="dot"></span>Last 7 days</div><div class="chart-box"><canvas id="chW"></canvas></div><div class="legend"><span><i style="background:var(--accent)"></i>Minutes</span></div></div>
      <div class="card next-steps"><div class="card-t"><span class="dot"></span>Next steps</div>${renderNextSteps(openings)}</div>
    </div>
    <div class="sec">Your chords · clean rate</div>
    <div class="mg">${renderChordGrid(state)}</div>
    <div class="sec">Quick actions</div>
    ${renderQuickActions()}`;

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
    <div class="metrics">
      ${tile('Total practice', total, 'm', total >= 60 ? `${(total / 60).toFixed(1)} hours` : 'minutes so far')}
      ${tile('Streak', streak.days, 'd', streakNote)}
      ${tile('Shapes practiced', shapes.length, '', shapesNote(shapes.length, cleanShapes))}
      ${tile('This week', thisWeek, 'm', thisWeek >= 60 ? 'On track for 60m' : `${60 - thisWeek}m to 60m`)}
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
  return `<div class="met"><div class="ml">${label}</div><div class="mv">${value}<span class="unit">${unit}</span></div><div class="ms">${note}</div></div>`;
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
    return `<a class="mc" href="${chordLink(chord)}" aria-label="${chord}: ${rate === null ? 'not practiced yet' : `${label} clean`}"><div class="mb"><div class="mfill" style="height:${fill}%"></div>${chord}</div><div class="mpct">${label}</div></a>`;
  }).join('');
}

// The three shortcut tiles.
function renderQuickActions() {
  return `
    <div class="sg">
      <button class="sug" data-go="practice"><span class="st">Start practice</span><span class="sd">Setlist, metronome, receipt</span></button>
      <button class="sug" data-go="chords"><span class="st">Chord library</span><span class="sd">168 chords, every shape</span></button>
      <button class="sug" data-go="progress"><span class="st">View progress</span><span class="sd">Charts and session log</span></button>
    </div>`;
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

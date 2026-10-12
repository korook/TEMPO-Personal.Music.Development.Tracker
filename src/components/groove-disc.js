// The groove disc (TEMPO_PLAN.md 3): weekly practice drawn as the grooves of a record.
// Each ring is a week, the outer ring is this week, and a ring's thickness shows its minutes.
// Also a tiny sparkline for personal-best trends.

import { escapeHtml } from '../utils/html.js';

const WEEKS = 8;
const DAY_MS = 864e5;

// ─── Groove disc ───

// Returns the disc for the last 8 weeks of sessions.
export function renderGrooveDisc(sessions, now = new Date()) {
  const weeks = weeklyTotals(sessions, now);
  const most = Math.max(30, ...weeks);
  const rings = weeks.map((minutes, index) => {
    const radius = 70 + index * 15;
    const width = minutes === 0 ? 1 : 2 + 11 * Math.min(1, minutes / most);
    const isThisWeek = index === WEEKS - 1;
    const className = minutes === 0 ? 'groove__ring groove__ring--empty' : isThisWeek ? 'groove__ring groove__ring--now' : 'groove__ring';
    return `<circle class="${className}" cx="200" cy="200" r="${radius}" stroke-width="${width.toFixed(1)}"><title>${weekLabel(index)}: ${minutes} min</title></circle>`;
  }).join('');
  const description = weeks.map((minutes, index) => `${weekLabel(index)} ${minutes} minutes`).join(', ');

  return `
    <figure class="groove">
      <svg class="groove__disc" viewBox="0 0 400 400" role="img" aria-label="${escapeHtml(`Weekly practice, oldest inside: ${description}`)}">
        <circle class="groove__body" cx="200" cy="200" r="196"/>
        ${rings}
        <circle class="groove__label" cx="200" cy="200" r="52"/>
        <text class="groove__minutes" x="200" y="206" text-anchor="middle" font-size="34">${weeks[WEEKS - 1]}</text>
        <text class="groove__unit" x="200" y="228" text-anchor="middle" font-size="13">MIN</text>
      </svg>
      <figcaption class="label">Each ring is a week, this week on the outside. Thicker = more minutes.</figcaption>
    </figure>`;
}

// Minutes per week for the last 8 weeks, oldest first (a week = 7 days ending today).
export function weeklyTotals(sessions, now = new Date()) {
  const totals = Array(WEEKS).fill(0);
  for (const session of sessions) {
    const weeksAgo = Math.floor((now.getTime() - new Date(session.end).getTime()) / (7 * DAY_MS));
    if (weeksAgo >= 0 && weeksAgo < WEEKS) totals[WEEKS - 1 - weeksAgo] += session.minutes;
  }
  return totals;
}

// "This week", "Last week", "3 weeks ago" ...
function weekLabel(index) {
  const weeksAgo = WEEKS - 1 - index;
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo} weeks ago`;
}

// ─── Sparkline ───

// Returns a small trend line for a list of numbers, with the last point marked.
// `lowerIsBetter` flips the drawing so better is always up (e.g. form times).
export function renderSparkline(values, { lowerIsBetter = false, label = '' } = {}) {
  if (values.length < 2) return '<span class="label">one result so far</span>';
  const width = 140;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = 4 + (index / (values.length - 1)) * (width - 8);
    const share = (value - min) / span;
    const y = 4 + (lowerIsBetter ? share : 1 - share) * (height - 8);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const [lastX, lastY] = points[points.length - 1];
  return `
    <svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label || `Trend: ${values.join(', ')}`)}">
      <polyline points="${points.map((point) => point.join(',')).join(' ')}"/>
      <circle cx="${lastX}" cy="${lastY}" r="3.5"/>
    </svg>`;
}

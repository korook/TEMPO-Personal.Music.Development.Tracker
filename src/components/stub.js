// Session receipts: printed at the end of each practice session with the date, minutes,
// new personal bests, the most frequent mistake and tomorrow's top opening, on thermal
// paper with torn edges. The session log is a pile of receipts (TEMPO_PLAN.md 3 and 6.8).

import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Returns one receipt. `stub` = { number, date (Date or ISO), minutes, seconds?, title,
// bests: [text], firsts?: [text], mistake: text | null, milestones: [text], nextOpening: text | null }.
export function renderStub(stub) {
  const date = new Date(stub.date);
  const dateText = date.toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeText = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  const rows = [];
  if (stub.bests && stub.bests.length) rows.push(['New bests', stub.bests.join(' · ')]);
  if (stub.firsts && stub.firsts.length) rows.push(['Firsts', stub.firsts.join(' · ')]);
  if (stub.mistake) rows.push(['Watch', stub.mistake]);
  if (stub.milestones && stub.milestones.length) rows.push(['Milestone', stub.milestones.join(' · ')]);
  if (rows.length === 0) rows.push(['Played', 'No new bests or mistakes logged. The minutes still count.']);

  return `
    <article class="stub" aria-label="Session ${escapeHtml(stub.number)} on ${escapeHtml(dateText)}, ${playedText(stub)}">
      <div class="stub__header"><span>Tempo · No. ${String(stub.number).padStart(4, '0')}</span><span>${escapeHtml(dateText)} ${timeText}</span></div>
      <h3 class="stub__title">${escapeHtml(stub.title || 'Practice session')}</h3>
      <hr class="stub__rule">
      <div class="stub__minutes"><span class="stub__minutes-value">${playedValue(stub).value}</span><span class="stub__unit">${playedValue(stub).unit} played</span></div>
      <hr class="stub__rule">
      <dl class="stub__rows">
        ${rows.map(([label, value]) => `<div class="stub__row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
      </dl>
      ${stub.nextOpening ? `<hr class="stub__rule"><p class="stub__next">Next → ${escapeHtml(stub.nextOpening)}</p>` : ''}
      ${renderBarcode(stub.number)}
    </article>`;
}

// The played time as a number and unit: seconds under a minute, else whole minutes,
// with "minute" or "minutes" to match.
export function playedValue(stub) {
  if (typeof stub.seconds === 'number' && stub.seconds < 60) return { value: stub.seconds, unit: stub.seconds === 1 ? 'second' : 'seconds' };
  return { value: stub.minutes, unit: stub.minutes === 1 ? 'minute' : 'minutes' };
}

// The played time in words, e.g. "1 minute" or "42 seconds".
function playedText(stub) {
  const { value, unit } = playedValue(stub);
  return `${value} ${unit}`;
}

// Returns a stack of receipts, newest first.
export function renderStubStack(stubs) {
  return `<ol class="stub-stack" aria-label="Session log">${stubs.map((stub) => `<li>${renderStub(stub)}</li>`).join('')}</ol>`;
}

// ─── Barcode ───

// Draws a decorative barcode whose bars come from the session number, so each receipt
// gets its own pattern. Hidden from screen readers.
function renderBarcode(number) {
  let seed = Number(number) * 9301 + 49297;
  const bars = [];
  for (let index = 0; index < 34; index++) {
    seed = (seed * 9301 + 49297) % 233280;
    bars.push(`<span style="width:${1 + (seed % 3)}px"></span>`);
  }
  return `<div class="stub__barcode" aria-hidden="true">${bars.join('')}</div>`;
}

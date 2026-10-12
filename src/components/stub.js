// Ticket stubs: printed at the end of each practice session with the date, minutes,
// new personal bests, the most frequent mistake and tomorrow's top opening.
// The session log is a stack of stubs (TEMPO_PLAN.md sections 3 and 6.8).

import { escapeHtml } from '../utils/html.js';

// ─── Rendering ───

// Returns one stub. `stub` = { number, date (Date or ISO), minutes, title, bests: [text],
// mistake: text | null, nextOpening: text | null }.
export function renderStub(stub) {
  const date = new Date(stub.date);
  const dateText = date.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const rows = [];
  if (stub.bests && stub.bests.length) rows.push(['New bests', stub.bests.join(' · ')]);
  if (stub.mistake) rows.push(['Watch out', stub.mistake]);
  if (rows.length === 0) rows.push(['Played', 'No new bests or mistakes logged. The minutes still count.']);

  return `
    <article class="stub" aria-label="Session ${escapeHtml(stub.number)} on ${escapeHtml(dateText)}, ${stub.minutes} minutes">
      <div class="stub__main">
        <div class="stub__header"><span>Admit one · Session ${escapeHtml(stub.number)}</span><span>${escapeHtml(dateText)}</span></div>
        <h3 class="stub__title">${escapeHtml(stub.title || 'Practice session')}</h3>
        <dl class="stub__rows">
          ${rows.map(([label, value]) => `<div class="stub__row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
        </dl>
        ${stub.nextOpening ? `<p class="stub__next">Next: ${escapeHtml(stub.nextOpening)}</p>` : ''}
      </div>
      <div class="stub__side">
        <span class="stub__minutes">${stub.minutes}</span>
        <span class="stub__unit">minutes</span>
      </div>
    </article>`;
}

// Returns a stack of stubs, newest first.
export function renderStubStack(stubs) {
  return `<ol class="stub-stack" aria-label="Session log">${stubs.map((stub) => `<li>${renderStub(stub)}</li>`).join('')}</ol>`;
}

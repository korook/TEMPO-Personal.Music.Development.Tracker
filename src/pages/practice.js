// The Practice page (TEMPO_PLAN.md 6.8): a session in three steps.
//   1. Setlist  the app proposes blocks built from your openings; remove or reorder, then start.
//   2. Play     each block has a timer and its own measuring tool; the metronome is always there.
//   3. Receipt  minutes, new personal bests, the most frequent mistake and the next opening.

import { getState, updateState, makeId } from '../state/storage.js';
import { buildSetlist, finishSession, blockLabel } from '../practice/session.js';
import { renderTapedCard } from '../components/taped-card.js';
import { renderStub } from '../components/stub.js';
import { renderMeasureTool, bindMeasureTool, resetMeasureTool, handleMeasureKey } from '../components/measure-tools.js';
import { renderMetronomePanel, bindMetronomePanel, handleMetronomeKey } from '../components/metronome-panel.js';
import { formatClock } from '../utils/time.js';
import { escapeHtml } from '../utils/html.js';

// Label-strip colours per block kind.
const BLOCK_COLOURS = { warmup: 'screen', fix: 'bronze', push: 'shell', review: 'sonic', ear: 'verdigris', free: 'screen' };

// The session in progress. phase: 'plan' | 'play' | 'done'.
const session = {
  phase: 'plan',
  id: null,
  start: null,
  blocks: [],
  current: 0,
  blockStart: null,
  stub: null,
};
let clockId = null;

document.addEventListener('keydown', (event) => {
  if (!isPracticePageOpen()) return;
  if (session.phase === 'play' && handleMeasureKey(event, document.getElementById('pg-practice'), logRep, renderPracticePage)) return;
  handleMetronomeKey(event);
});

// ─── Rendering ───

// Draws the page for the current step.
export function renderPracticePage() {
  const page = document.getElementById('pg-practice');
  if (session.phase === 'plan' && session.blocks.length === 0) proposeSetlist();

  const body = { plan: renderPlan, play: renderPlay, done: renderDone }[session.phase]();
  page.innerHTML = `${body}${renderMetronomePanel()}`;
  bindEvents(page);
}

// Step 1: the proposed setlist as cards with move / remove keys.
function renderPlan() {
  const cards = session.blocks.map((block, index) => renderTapedCard({
    kicker: blockKicker(block),
    title: block.title,
    body: block.note,
    colour: BLOCK_COLOURS[block.kind],
    index,
    actions: `
      <button class="button button--icon" data-move="${index}" data-by="-1" aria-label="Move ${escapeHtml(block.title)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="button button--icon" data-move="${index}" data-by="1" aria-label="Move ${escapeHtml(block.title)} later" ${index === session.blocks.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="button button--icon" data-remove="${index}" aria-label="Remove ${escapeHtml(block.title)}">✕</button>`,
  })).join('');
  const total = session.blocks.reduce((sum, block) => sum + (block.minutes || 0), 0);

  return `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Practice · tonight's setlist</span>
        <h1 class="section-head__title section-head__title--hero">Setlist</h1>
        <p class="section-head__lead">Built from what your playing needs next. Reorder or remove blocks, then start. About ${total} minutes, plus free play.</p>
      </div>
      <div class="measure__row">
        <button class="button button--primary" data-start>Start session</button>
        <button class="button" data-new-setlist>Suggest a new setlist</button>
      </div>
    </header>
    <section class="setlist" aria-label="Setlist">${cards}</section>`;
}

// Step 2: the current block with its timer and measuring tool.
function renderPlay() {
  const block = session.blocks[session.current];
  const state = getState();
  const item = block.itemId ? state.items[block.itemId] : null;
  const isLast = session.current === session.blocks.length - 1;
  const strip = session.blocks.map((other, index) => {
    const status = index < session.current ? 'done' : index === session.current ? 'current' : 'next';
    return `<li class="block-pill block-pill--${status}"><span class="label">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(blockLabel(other))}</li>`;
  }).join('');

  return `
    <header class="page-head">
      <ol class="block-strip" aria-label="Setlist progress">${strip}</ol>
      <div class="play-head">
        <div class="section-head">
          <span class="section-head__kicker">Block ${session.current + 1} of ${session.blocks.length} · ${blockLabel(block)}</span>
          <h1 class="section-head__title">${escapeHtml(block.title)}</h1>
          <p class="section-head__lead">${escapeHtml(block.note)}</p>
        </div>
        <div class="readout play-clock">
          <span class="readout__value" data-block-clock>${formatClock(blockSeconds())}</span>
          <span class="readout__label">${block.minutes ? `of ${block.minutes}:00` : 'free play'}</span>
        </div>
      </div>
    </header>
    <section class="panel measure-panel" aria-label="Measure">
      ${renderMeasureTool({ block, item, reps: state.reps })}
    </section>
    <div class="measure__row play-keys">
      ${isLast ? '' : '<button class="button button--primary" data-next>Next block →</button>'}
      <button class="button${isLast ? ' button--primary' : ''}" data-finish>Finish session</button>
    </div>`;
}

// Step 3: the receipt.
function renderDone() {
  return `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Practice · session saved</span>
        <h1 class="section-head__title section-head__title--hero">Session saved</h1>
        <p class="section-head__lead">Here's your receipt. It also goes into your session log on the Progress page.</p>
      </div>
    </header>
    <section class="receipt-wrap">
      ${renderStub(session.stub)}
      <button class="button button--primary" data-again>Plan the next session</button>
    </section>`;
}

// The label strip text, e.g. "Fix · 5 min".
function blockKicker(block) {
  return block.minutes ? `${blockLabel(block)} · ${block.minutes} min` : blockLabel(block);
}

// ─── Events ───

// Connects the buttons for the current step, the measuring tool and the metronome.
function bindEvents(page) {
  bindMetronomePanel(page, renderPracticePage);
  page.querySelectorAll('[data-move]').forEach((button) => {
    button.addEventListener('click', () => moveBlock(Number(button.dataset.move), Number(button.dataset.by)));
  });
  page.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => removeBlock(Number(button.dataset.remove)));
  });
  onClick(page, '[data-start]', startSession);
  onClick(page, '[data-new-setlist]', () => { proposeSetlist(); renderPracticePage(); });
  onClick(page, '[data-next]', nextBlock);
  onClick(page, '[data-finish]', endSession);
  onClick(page, '[data-again]', () => { session.phase = 'plan'; session.blocks = []; renderPracticePage(); });

  if (session.phase === 'play') {
    const block = session.blocks[session.current];
    const item = block.itemId ? getState().items[block.itemId] : null;
    bindMeasureTool(page.querySelector('.measure-panel'), { block, item }, logRep, renderPracticePage);
  }
}

// Adds a click handler if the element exists.
function onClick(page, selector, handler) {
  const element = page.querySelector(selector);
  if (element) element.addEventListener('click', handler);
}

// Returns true while the Practice page is the one on screen.
function isPracticePageOpen() {
  return document.getElementById('pg-practice').classList.contains('on');
}

// ─── Setlist ───

// Asks the practice model for a fresh setlist (new items it suggests are saved).
function proposeSetlist() {
  updateState((state) => {
    session.blocks = buildSetlist(state);
  });
}

// Moves a block up or down the setlist.
function moveBlock(index, by) {
  const target = index + by;
  if (target < 0 || target >= session.blocks.length) return;
  [session.blocks[index], session.blocks[target]] = [session.blocks[target], session.blocks[index]];
  renderPracticePage();
}

// Takes a block out of the setlist (at least one block stays).
function removeBlock(index) {
  if (session.blocks.length <= 1) return;
  session.blocks.splice(index, 1);
  renderPracticePage();
}

// ─── Session ───

// Starts the session at the first block.
function startSession() {
  Object.assign(session, { phase: 'play', id: makeId(), start: new Date().toISOString(), current: 0, blockStart: Date.now() });
  resetMeasureTool();
  startClock();
  renderPracticePage();
}

// Moves to the next block.
function nextBlock() {
  session.current = Math.min(session.current + 1, session.blocks.length - 1);
  session.blockStart = Date.now();
  resetMeasureTool();
  renderPracticePage();
}

// Saves the session and shows the receipt.
function endSession() {
  stopClock();
  resetMeasureTool();
  updateState((state) => {
    session.stub = finishSession(state, { id: session.id, start: session.start, blocks: session.blocks });
  });
  session.phase = 'done';
  renderPracticePage();
}

// Saves one rep for the current block's item.
function logRep(fields) {
  const block = session.blocks[session.current];
  if (!block.itemId) return;
  updateState((state) => {
    state.reps.push({ id: makeId(), itemId: block.itemId, sessionId: session.id, at: new Date().toISOString(), ...fields });
  });
  renderPracticePage();
}

// ─── Block timer ───

// Seconds since the current block started.
function blockSeconds() {
  return session.blockStart ? Math.floor((Date.now() - session.blockStart) / 1000) : 0;
}

// Ticks the block clock once a second while a session runs.
function startClock() {
  stopClock();
  clockId = setInterval(() => {
    const display = document.querySelector('[data-block-clock]');
    if (display) display.textContent = formatClock(blockSeconds());
  }, 1000);
}

// Stops the block clock.
function stopClock() {
  clearInterval(clockId);
  clockId = null;
}

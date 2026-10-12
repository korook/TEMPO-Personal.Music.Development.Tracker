// The measuring tools used during a practice block (TEMPO_PLAN.md 6.3). Each turns playing
// into counts, times and specific mistakes instead of a feeling:
//   clean-check  chord shapes: tap the strings that buzzed or got muted, or "All clean";
//                also a form timer and a "from memory" check with the diagram hidden
//   changes      chord changes: a 60-second test, tap for every clean change
//   bpm-pass     progressions and exercises: mark each pass at the metronome tempo clean or not
//   none         ear and free-play blocks: just the block timer
// Every tool reports reps through `logRep(fields)`; the page saves them.

import { renderChordDiagram } from './chord-diagram.js';
import { voicingForItem } from '../practice/items.js';
import { cleanRate, changesSummary, cleanBpmBest, formTimeSeconds, recallSummary } from '../practice/measures.js';
import { MISTAKES, TAG_STRINGS } from '../data/mistake-tips.js';
import { thumbnailVoicing } from '../chords/library.js';
import { parseChordSymbol } from '../theory/chords.js';
import { getMetronome } from '../audio/metronome.js';
import { startChordDrill } from './metronome-panel.js';
import { playChord } from '../audio/guitar-synth.js';
import { getSettings } from '../state/settings.js';
import { escapeHtml } from '../utils/html.js';
import { mountEarQuiz } from './ear-quiz.js';
import { getExercise } from '../ear/index.js';
import { unlockedLevel } from '../ear/scoring.js';
import { getState } from '../state/storage.js';

const TEST_SECONDS = 60;
const EXTRA_MISTAKES = ['finger-order', 'tension', 'strum-range'];
const PASS_MISTAKES = ['late-change', 'timing'];

// Tool state that must survive redraws within a block.
const tool = {
  strings: {},          // string name → 'buzz' | 'mute'
  extras: new Set(),    // other mistake tags picked for the next rep
  hidden: false,        // diagram hidden for a recall try
  formStart: null,      // when the form timer started
  test: null,           // { endsAt, count, intervalId } during a one-minute test
};

// ─── Rendering ───

// Returns the tool for a block. `context` = { block, item, reps }.
export function renderMeasureTool(context) {
  const { block } = context;
  if (block.measure === 'clean-check') return renderCleanCheck(context);
  if (block.measure === 'changes') return renderChanges(context);
  if (block.measure === 'bpm-pass') return renderBpmPass(context);
  if (block.measure === 'ear') return '<div class="measure measure--ear"><div data-ear-drill></div></div>';
  return renderNoMeasure(block);
}

// Clears picks between blocks.
export function resetMeasureTool() {
  tool.strings = {};
  tool.extras = new Set();
  tool.hidden = false;
  tool.formStart = null;
  if (tool.test) clearInterval(tool.test.intervalId);
  tool.test = null;
}

// Chord shape: the diagram (or a hidden card), the string strip, other mistakes and the keys.
function renderCleanCheck({ item, reps }) {
  const voicing = voicingForItem(item);
  const rate = cleanRate(reps, item.id);
  const form = formTimeSeconds(reps, item.id);
  const recall = recallSummary(reps, item.id);
  const strings = TAG_STRINGS.map((name) => {
    const mark = tool.strings[name];
    const text = mark === 'buzz' ? 'buzz' : mark === 'mute' ? 'mute' : '';
    return `<button class="string-key" data-string="${name}" data-mark="${mark || ''}" aria-label="${name} string${text ? `: ${text}` : ''}">${name}<span>${text || '·'}</span></button>`;
  }).join('');
  const extras = EXTRA_MISTAKES.map((tag) => `<button class="chip" data-extra="${tag}" aria-pressed="${tool.extras.has(tag)}">${MISTAKES[tag].label}</button>`).join('');

  return `
    <div class="measure measure--clean">
      <div class="measure__shape">
        ${tool.hidden
          ? '<div class="measure__hidden"><span class="label">Diagram hidden</span><p>Form it from memory, strum, then check.</p></div>'
          : renderChordDiagram(voicing, { size: 200, leftHanded: getSettings().leftHanded })}
        <div class="measure__row">
          <button class="button" data-play-shape>▶ Hear it</button>
          <button class="button" data-toggle-hidden>${tool.hidden ? 'Show diagram' : 'Hide for recall'}</button>
        </div>
        ${tool.hidden ? `
          <div class="measure__row">
            <button class="button button--primary" data-recall="true">Got it right</button>
            <button class="button" data-recall="false">Not quite</button>
          </div>` : ''}
      </div>
      <div class="measure__log">
        <span class="label">After each strum: tap a string that buzzed (tap twice if it was muted)</span>
        <div class="string-strip">${strings}</div>
        <span class="label">Anything else?</span>
        <div class="measure__row">${extras}</div>
        <div class="measure__row">
          <button class="button button--primary" data-log="clean">All clean ⏎</button>
          <button class="button" data-log="mistakes">Log with mistakes</button>
        </div>
        <div class="measure__row">
          <button class="button${tool.formStart ? ' button--live' : ''}" data-form-timer>${tool.formStart ? 'Stop: chord is formed' : 'Form timer'}</button>
        </div>
        <div class="measure__readouts">
          ${readout(rate.total ? `${rate.clean}/${rate.total}` : '–', 'clean, last 10')}
          ${readout(form !== null ? `${form}s` : '–', 'form time')}
          ${readout(recall.tries ? `${recall.successes}/${recall.tries}` : '–', 'from memory')}
        </div>
      </div>
    </div>`;
}

// Chord change: both chords, the 60-second test and the tap key.
function renderChanges({ item, reps }) {
  const shapes = item.chords.map((symbol) => {
    const { root, quality } = parseChordSymbol(symbol);
    return `<figure class="measure__pair-shape">${renderChordDiagram(thumbnailVoicing(root, quality), { size: 140, showIntervals: false, leftHanded: getSettings().leftHanded })}<figcaption>${escapeHtml(symbol)}</figcaption></figure>`;
  }).join('<span class="measure__arrow" aria-hidden="true">↔</span>');
  const { best, latest } = changesSummary(reps, item.id);
  const running = Boolean(tool.test);
  const secondsLeft = running ? Math.max(0, Math.ceil((tool.test.endsAt - Date.now()) / 1000)) : TEST_SECONDS;

  return `
    <div class="measure measure--changes">
      <div class="measure__pair">${shapes}</div>
      <div class="measure__log">
        <span class="label">One-minute test: switch back and forth, tap for every clean change</span>
        <div class="measure__readouts">
          ${readout(`<span data-test-seconds>${secondsLeft}</span>s`, 'left')}
          ${readout(`<span data-test-count>${running ? tool.test.count : 0}</span>`, 'changes')}
          ${readout(best !== null ? best : '–', 'your best')}
          ${readout(latest !== null ? latest : '–', 'last time')}
        </div>
        ${running
          ? '<button class="button button--primary tap-key" data-tap>Clean change ⏎</button>'
          : '<button class="button button--primary" data-start-test>Start the 60-second test</button>'}
      </div>
    </div>`;
}

// Progression or exercise: tempo, the chord drill and clean / not clean per pass.
function renderBpmPass({ item, reps }) {
  const bpm = getMetronome().getSettings().bpm;
  const best = cleanBpmBest(reps, item.id);
  const atTempo = reps.filter((rep) => rep.itemId === item.id && rep.kind === 'bpm-pass');
  let streak = 0;
  for (let index = atTempo.length - 1; index >= 0 && atTempo[index].clean && atTempo[index].bpm === bpm; index--) streak++;
  const extras = PASS_MISTAKES.map((tag) => `<button class="chip" data-extra="${tag}" aria-pressed="${tool.extras.has(tag)}">${MISTAKES[tag].label}</button>`).join('');

  return `
    <div class="measure measure--bpm">
      <div class="measure__log">
        <span class="label">Play a pass at the metronome tempo, then mark it. Three clean passes in a row set a new best.</span>
        <div class="measure__readouts">
          ${readout(bpm, 'tempo now')}
          ${readout(`${Math.min(streak, 3)}/3`, 'clean in a row')}
          ${readout(best !== null ? best : '–', 'best clean BPM')}
        </div>
        ${item.type === 'progression' ? '<div class="measure__row"><button class="button" data-drill>Show the chords on the metronome</button></div>' : ''}
        <span class="label">If it wasn't clean, what happened?</span>
        <div class="measure__row">${extras}</div>
        <div class="measure__row">
          <button class="button button--primary" data-pass="clean">Clean pass ⏎</button>
          <button class="button" data-pass="not">Not clean</button>
        </div>
      </div>
    </div>`;
}

// Ear and free play: nothing to measure yet.
function renderNoMeasure(block) {
  const text = block.kind === 'ear'
    ? 'Ear training arrives in Phase 5. For now: before you strum each chord, hum its root note, then check.'
    : 'Play anything you like. The time still counts.';
  return `<div class="measure measure--none"><p>${text}</p></div>`;
}

// A small dark readout.
function readout(value, label) {
  return `<div class="readout"><span class="readout__value">${value}</span><span class="readout__label">${label}</span></div>`;
}

// ─── Events ───

// Connects the tool. logRep(fields) saves a rep; redraw() redraws the block.
export function bindMeasureTool(container, { block, item }, logRep, redraw) {
  const earDrill = container.querySelector('[data-ear-drill]');
  if (earDrill) mountEarDrill(earDrill, block);
  container.querySelectorAll('[data-string]').forEach((key) => {
    key.addEventListener('click', () => {
      const name = key.dataset.string;
      tool.strings[name] = nextStringMark(tool.strings[name]);
      redraw();
    });
  });
  container.querySelectorAll('[data-extra]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.extra;
      if (tool.extras.has(tag)) tool.extras.delete(tag);
      else tool.extras.add(tag);
      redraw();
    });
  });
  on(container, '[data-log="clean"]', () => logCleanCheck(logRep, true));
  on(container, '[data-log="mistakes"]', () => logCleanCheck(logRep, false));
  on(container, '[data-toggle-hidden]', () => { tool.hidden = !tool.hidden; redraw(); });
  on(container, '[data-play-shape]', () => { const voicing = voicingForItem(item); if (voicing) playChord(voicing.frets); });
  container.querySelectorAll('[data-recall]').forEach((button) => {
    button.addEventListener('click', () => {
      logRep({ kind: 'recall', success: button.dataset.recall === 'true' });
      tool.hidden = false;
      redraw();
    });
  });
  on(container, '[data-form-timer]', () => {
    if (tool.formStart) {
      logRep({ kind: 'form-time', ms: Math.round(performance.now() - tool.formStart) });
      tool.formStart = null;
    } else {
      tool.formStart = performance.now();
    }
    redraw();
  });
  on(container, '[data-start-test]', () => startChangesTest(logRep, redraw));
  on(container, '[data-tap]', () => tapChange(container));
  container.querySelectorAll('[data-pass]').forEach((button) => {
    button.addEventListener('click', () => logPass(logRep, button.dataset.pass === 'clean', redraw));
  });
  on(container, '[data-drill]', () => startChordDrill(item.chords, 4));
}

// Handles ⏎ for the current tool: all clean, a tap, or a clean pass.
export function handleMeasureKey(event, container, logRep, redraw) {
  if (event.key !== 'Enter' || event.target.closest('input, select, textarea, button, a')) return false;
  const target = container.querySelector('[data-log="clean"], [data-tap], [data-pass="clean"]');
  if (!target) return false;
  event.preventDefault();
  target.click();
  return true;
}

// Runs a short ear drill inside the session: the duel from the setlist if there is one,
// otherwise intervals at your level. Ear results are saved like any other ear game.
function mountEarDrill(container, block) {
  const ear = block.ear || { exercise: 'intervals', pool: null };
  const exercise = getExercise(ear.exercise);
  const level = unlockedLevel(getState().ear.results, exercise.id, exercise.levels);
  mountEarQuiz(container, {
    drills: [{ exercise: exercise.id, level, pool: ear.pool, questions: 5, label: block.title }],
    compact: true,
  });
}

// Cycles a string's mark: nothing → buzzed → muted → nothing.
function nextStringMark(mark) {
  if (!mark) return 'buzz';
  if (mark === 'buzz') return 'mute';
  return undefined;
}

// Adds a click handler if the element exists.
function on(container, selector, handler) {
  const element = container.querySelector(selector);
  if (element) element.addEventListener('click', handler);
}

// ─── Logging ───

// Logs a chord-shape rep, clean or with the picked mistakes, then clears the picks.
function logCleanCheck(logRep, allClean) {
  const mistakes = allClean ? [] : [
    ...Object.entries(tool.strings).filter(([, mark]) => mark).map(([name, mark]) => `${mark}:${name}`),
    ...tool.extras,
  ];
  if (!allClean && mistakes.length === 0) return;
  logRep({ kind: 'clean-check', clean: mistakes.length === 0, mistakes });
  tool.strings = {};
  tool.extras = new Set();
}

// Logs one pass at the current metronome tempo.
function logPass(logRep, clean, redraw) {
  const mistakes = clean ? [] : [...tool.extras];
  logRep({ kind: 'bpm-pass', bpm: getMetronome().getSettings().bpm, clean, mistakes });
  tool.extras = new Set();
  redraw();
}

// Starts the one-minute test; when time is up the count is logged.
function startChangesTest(logRep, redraw) {
  tool.test = { endsAt: Date.now() + TEST_SECONDS * 1000, count: 0, intervalId: null };
  tool.test.intervalId = setInterval(() => {
    const left = Math.max(0, Math.ceil((tool.test.endsAt - Date.now()) / 1000));
    const display = document.querySelector('[data-test-seconds]');
    if (display) display.textContent = left;
    if (left === 0) {
      clearInterval(tool.test.intervalId);
      logRep({ kind: 'changes', count: tool.test.count });
      tool.test = null;
      redraw();
    }
  }, 200);
  redraw();
}

// Counts one clean change during the test.
function tapChange(container) {
  if (!tool.test) return;
  tool.test.count++;
  const display = container.querySelector('[data-test-count]');
  if (display) display.textContent = tool.test.count;
}

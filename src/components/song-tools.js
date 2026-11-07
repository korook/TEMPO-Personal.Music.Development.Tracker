// The Songs (SG) measuring tools (TEMPO_UPDATE_REPERTOIRE.md 8.1), used in practice blocks
// and on the song page:
//   part-loop  loop one part with the metronome's chord-change mode at a ladder tempo, and
//              mark each pass clean or not (with a mistake tag); saved as clean-check reps
//   run        the whole song at a ladder tempo: tap "Stop" each time you stop, then finish;
//              saved as a `run` rep and as a run-through in the repertoire
// Tempo ladder: 70% → 85% → 100% of the original tempo.

import { findSong, parseBars } from '../repertoire/songs.js';
import { TEMPO_LADDER, nextLadderStep, recordRun, bestCleanTempo } from '../repertoire/state.js';
import { cleanRate } from '../practice/measures.js';
import { MISTAKES } from '../data/mistake-tips.js';
import { getMetronome, TIME_SIGNATURES } from '../audio/metronome.js';
import { startChordDrill } from './metronome-panel.js';
import { getState, updateState } from '../state/storage.js';
import { escapeHtml } from '../utils/html.js';
import { chordLink } from '../router.js';

const LOOP_MISTAKES = ['late-change', 'timing', 'strum-range'];

// Tool state that survives redraws within a block.
const songTool = { tempoPct: null, stops: 0, running: false, mistakes: new Set() };

// Clears the tool between blocks.
export function resetSongTool() {
  Object.assign(songTool, { tempoPct: null, stops: 0, running: false, mistakes: new Set() });
}

// ─── Shared ───

// The ladder step chosen (or the next one the song needs).
function chosenTempo(songId) {
  if (songTool.tempoPct) return songTool.tempoPct;
  const entry = getState().repertoire.songs[songId];
  return entry ? nextLadderStep(entry) : TEMPO_LADDER[0];
}

// The ladder chips: 70% / 85% / 100%, with the BPM each one means for this song.
function renderLadder(song, tempoPct) {
  return `<div class="chip-row" role="group" aria-label="Tempo">${TEMPO_LADDER.map((step) => (
    `<button class="chip" data-ladder="${step}" aria-pressed="${step === tempoPct}">${step}%${song.bpm ? ` · ${Math.round(song.bpm * step / 100)} BPM` : ''}</button>`
  )).join('')}</div>`;
}

// Sets the metronome to the song's tempo at a ladder step (when the tempo is known).
function setMetronomeTempo(song, tempoPct) {
  if (!song.bpm) return;
  const metronome = getMetronome();
  metronome.setBpm(Math.round(song.bpm * tempoPct / 100));
  if (TIME_SIGNATURES[song.timeSignature]) metronome.setTimeSignature(song.timeSignature);
}

// ─── Part loop ───

// The part loop tool for a song-part item.
export function renderPartLoop({ item, reps }) {
  const song = findSong(item.songId, getState());
  const part = song && song.parts.find((candidate) => candidate.id === item.partId);
  if (!song || !part) return '<p class="progress-empty">This part is no longer in the song.</p>';
  const tempoPct = chosenTempo(song.id);
  const rate = cleanRate(reps, item.id);
  const bars = parseBars(part.bars);
  return `
    <div class="measure measure--song">
      <div class="measure__log">
        <span class="label">${escapeHtml(part.name)} · ${bars.length ? `${bars.length} bars` : 'riff'}</span>
        ${renderBarChips(part)}
        ${renderLadder(song, tempoPct)}
        <div class="measure__row">
          ${bars.length ? '<button class="button" data-loop-part>Loop with the metronome</button>' : ''}
          ${!song.bpm ? '<span class="label">Tempo not checked yet: tap it in on the metronome</span>' : ''}
        </div>
        <span class="label">After each pass: anything off?</span>
        <div class="measure__row">${LOOP_MISTAKES.map((tag) => `<button class="chip" data-loop-mistake="${tag}" aria-pressed="${songTool.mistakes.has(tag)}">${MISTAKES[tag].label}</button>`).join('')}</div>
        <div class="measure__row">
          <button class="button button--primary" data-loop-pass="clean">Clean pass ⏎</button>
          <button class="button" data-loop-pass="mistakes">Not clean</button>
        </div>
        <div class="measure__readouts">
          <span class="readout"><span class="readout__value">${rate.total ? `${rate.clean}/${rate.total}` : '–'}</span><span class="readout__label">clean, last 10</span></span>
        </div>
      </div>
    </div>`;
}

// A part's bars as chord chips (each opens the chord in the library).
export function renderBarChips(part) {
  const bars = parseBars(part.bars);
  if (!bars.length) return '<p class="song-bars song-bars--riff">Riff or picked line: follow the chord sheet.</p>';
  return `<ol class="song-bars">${bars.map((bar) => `<li class="song-bars__bar">${bar.map((name) => `<a class="chip song-chip" href="${chordLink(name.split('/')[0])}">${escapeHtml(name)}</a>`).join('')}</li>`).join('')}</ol>`;
}

// Starts the metronome's chord-change mode with a part's chords, one chord per bar (or per
// half bar when a bar holds two chords).
export function loopPart(song, part, tempoPct) {
  const bars = parseBars(part.bars);
  if (!bars.length) return;
  setMetronomeTempo(song, tempoPct);
  const beats = (TIME_SIGNATURES[song.timeSignature] || TIME_SIGNATURES['4/4']).beats;
  const split = bars.some((bar) => bar.length > 1);
  const chords = bars.flatMap((bar) => (split ? (bar.length > 1 ? bar.slice(0, 2) : [bar[0], bar[0]]) : bar));
  startChordDrill(chords, split ? Math.max(1, Math.floor(beats / 2)) : beats);
}

// ─── Run-through ───

// The run-through tool for a song item (or the song page).
export function renderRunTool(songId) {
  const song = findSong(songId, getState());
  if (!song) return '<p class="progress-empty">This song is no longer in your repertoire.</p>';
  const entry = getState().repertoire.songs[songId];
  const tempoPct = chosenTempo(songId);
  const best = bestCleanTempo(entry);
  return `
    <div class="measure measure--song run-tool" data-running="${songTool.running}">
      <div class="measure__log">
        <span class="label">Whole song at ${tempoPct}% · ${best === null ? 'no clean run yet' : `best clean run ${best}%`}</span>
        ${renderLadder(song, tempoPct)}
        <div class="measure__row">
          ${songTool.running
            ? `<button class="button button--live run-tool__stop" data-run-stop>Stop <span class="label">${songTool.stops}</span></button>
               <button class="button button--primary" data-run-finish>Finish run · ${songTool.stops} stop${songTool.stops === 1 ? '' : 's'}</button>`
            : '<button class="button button--primary" data-run-start>Start run-through</button>'}
        </div>
        <p class="label">${songTool.running ? 'Tap Stop every time you stop or restart a bar.' : 'Play the whole song without stopping. Two clean runs at 100% on different days make it Stage-ready.'}</p>
      </div>
    </div>`;
}

// ─── Events ───

// Connects the song tools inside `container`. `logRep(fields)` saves a rep; `redraw()` redraws.
export function bindSongTools(container, { item, songId }, logRep, redraw) {
  const id = songId || (item && item.songId);
  container.querySelectorAll('[data-ladder]').forEach((chip) => chip.addEventListener('click', () => {
    songTool.tempoPct = Number(chip.dataset.ladder);
    const song = findSong(id, getState());
    if (song) setMetronomeTempo(song, songTool.tempoPct);
    redraw();
  }));
  container.querySelectorAll('[data-loop-mistake]').forEach((chip) => chip.addEventListener('click', () => {
    const tag = chip.dataset.loopMistake;
    if (songTool.mistakes.has(tag)) songTool.mistakes.delete(tag);
    else songTool.mistakes.add(tag);
    redraw();
  }));
  container.querySelectorAll('[data-loop-pass]').forEach((button) => button.addEventListener('click', () => logLoopPass(logRep, button.dataset.loopPass === 'clean')));
  const loop = container.querySelector('[data-loop-part]');
  if (loop) loop.addEventListener('click', () => {
    const song = findSong(id, getState());
    const part = song.parts.find((candidate) => candidate.id === item.partId);
    loopPart(song, part, chosenTempo(id));
  });
  const start = container.querySelector('[data-run-start]');
  if (start) start.addEventListener('click', () => {
    const song = findSong(id, getState());
    setMetronomeTempo(song, chosenTempo(id));
    Object.assign(songTool, { running: true, stops: 0 });
    redraw();
  });
  const stop = container.querySelector('[data-run-stop]');
  if (stop) stop.addEventListener('click', () => {
    songTool.stops++;
    redraw();
  });
  const finish = container.querySelector('[data-run-finish]');
  if (finish) finish.addEventListener('click', () => finishRun(id, logRep));
}

// Saves one part-loop pass with any mistakes picked.
function logLoopPass(logRep, clean) {
  const mistakes = clean ? [] : [...songTool.mistakes];
  songTool.mistakes = new Set();
  logRep({ kind: 'clean-check', clean, mistakes, tempoPct: songTool.tempoPct });
}

// Ends a run-through: saves it in the repertoire and as a `run` rep.
function finishRun(songId, logRep) {
  const tempoPct = chosenTempo(songId);
  const stops = songTool.stops;
  Object.assign(songTool, { running: false, stops: 0 });
  updateState((state) => recordRun(state, songId, { tempoPct, stops }));
  logRep({ kind: 'run', tempoPct, stops });
}

// Whether a run-through is in progress (for the case's green LED).
export function isRunning() {
  return songTool.running;
}

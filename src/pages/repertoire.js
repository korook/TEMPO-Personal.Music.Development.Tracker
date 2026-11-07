// The Repertoire page (TEMPO_UPDATE_REPERTOIRE.md 7.3–7.5). Views:
//   #/repertoire                  hero "Now learning", shelves (Stage-ready, Played through,
//                                 Learning) and suggestions with the unlock line and filters
//   #/repertoire/add              add a song
//   #/song/<id>                   one song: parts, chords used, run-through
//   #/song/<id>/loop/<part>       the song page with that part looping
//   #/song/<id>/run               the song page at the run-through
//   #/song/<id>/edit              edit a song (your own: everything; built-in: your capo)
// Every song is a CD case; there is no 100% and no "done" (plan 6.1).

import { findSong, songChords, baseChord, parseBars, unknownChords, SONG_SETS } from '../repertoire/songs.js';
import {
  addSong, setPartState, partState, songState, repertoireSongs, nowLearning, progressLine,
  bestCleanTempo, TEMPO_LADDER, PART_STATES, PART_LABELS, SONG_LABELS, isEncoreDue,
} from '../repertoire/state.js';
import { rankSuggestions, unlockLines } from '../repertoire/suggestions.js';
import { lookupCoverOnline } from '../repertoire/covers.js';
import { renderCdCase, bindCdCases, LEVEL_LABELS } from '../components/cd-case.js';
import { renderRunTool, renderBarChips, bindSongTools, loopPart, resetSongTool, isRunning } from '../components/song-tools.js';
import { renderMetronomeBar, renderMetronomePanel, bindMetronomePanel } from '../components/metronome-panel.js';
import { renderChordDiagram } from '../components/chord-diagram.js';
import { renderArtPlaceholder } from '../components/art-placeholder.js';
import { thumbnailVoicing } from '../chords/library.js';
import { parseChordSymbol } from '../theory/chords.js';
import { voicingItem, ensureItem, songItemId } from '../practice/items.js';
import { cleanRate } from '../practice/measures.js';
import { getState, updateState, makeId } from '../state/storage.js';
import { getSettings, updateSettings } from '../state/settings.js';
import { navigate, chordLink } from '../router.js';
import { escapeHtml } from '../utils/html.js';

const FILTERS = [
  ['all', 'All'], ['1', 'Level 1'], ['2', 'Level 2'], ['3', 'Level 3'], ['ready', 'Ready now'], ['one-away', 'One chord away'],
];
const TUNINGS = { standard: 'Standard', 'half-step-down': 'Half a step down', 'drop-d': 'Drop D' };

// Page-level view state (kept while you move around the app).
const view = { filter: 'all', metronomeOpen: false };

// ─── Routing ───

// Draws the Repertoire overview or the add form.
export function renderRepertoirePage(path = '') {
  if (path === 'add') return renderSongForm(null);
  return renderOverview();
}

// Draws a song page (or its edit form). `path` = "<id>", "<id>/loop/<part>", "<id>/run" or "<id>/edit".
export function renderSongPage(path = '') {
  const [id, action, partId] = path.split('/');
  const song = findSong(id, getState());
  if (!song) {
    navigate('#/repertoire');
    return;
  }
  if (action === 'edit') return renderSongForm(song);
  return renderSong(song, { action, partId });
}

// The page element.
function page() {
  return document.getElementById('pg-repertoire');
}

// ─── Overview ───

// Hero, shelves and suggestions.
function renderOverview() {
  const state = getState();
  const rows = repertoireSongs(state);
  const hero = nowLearning(state);
  const shelf = (status) => rows.filter((row) => row.state === status);
  page().innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Repertoire</span>
        <h1 class="section-head__title section-head__title--hero">Repertoire</h1>
        <p class="section-head__lead">The songs you play, part by part. Weak parts come back as part loops; finished songs come back as encores.</p>
      </div>
      <div class="measure__row"><a class="button" href="#/repertoire/add">+ Add a song</a></div>
    </header>
    ${hero ? renderHero(state, hero) : renderEmpty(rows.length)}
    ${renderShelf('Stage-ready', shelf('stage-ready'), state)}
    ${renderShelf('Played through', shelf('played-through'), state)}
    ${renderShelf('Learning', shelf('learning').filter((row) => !hero || row.song.id !== hero.song.id), state)}
    ${renderSuggestions(state)}`;
  bindOverview();
}

// The "Now learning" hero: the case with its disc out (the part ring is the progress), the
// parts as tracks on a screen, the tempo ladder and two actions.
function renderHero(state, { song, entry }) {
  const weakest = weakestPart(state, song, entry);
  const best = bestCleanTempo(entry);
  const tracks = song.parts.map((part, index) => {
    const status = partState(entry, part.id);
    return `<li class="tracklist__row" data-part="${status}"><span class="tracklist__no">${String(index + 1).padStart(2, '0')}</span><span class="tracklist__name">${escapeHtml(part.name)}</span><span class="tracklist__state">${PART_LABELS[status]}</span></li>`;
  }).join('');
  return `
    <section class="rep-hero">
      <div class="rep-hero__case">${renderCdCase(song, { entry, href: `#/song/${song.id}`, size: 'hero', running: isRunning() })}</div>
      <div class="panel rep-hero__panel">
        <div class="section-head">
          <span class="section-head__kicker">Now learning · ${escapeHtml(song.artist || '')}</span>
          <h2 class="section-head__title">${escapeHtml(song.title)}</h2>
          <p class="section-head__lead">${escapeHtml(progressLine(song, entry))}</p>
        </div>
        <ol class="tracklist" aria-label="Parts">${tracks}</ol>
        ${renderLadderMeter(best)}
        <div class="measure__row">
          ${weakest ? `<a class="button button--primary" href="#/song/${song.id}/loop/${weakest.id}">Practise weakest part</a>` : ''}
          <a class="button${weakest ? '' : ' button--primary'}" href="#/song/${song.id}/run">Run-through</a>
        </div>
      </div>
    </section>`;
}

// The tempo ladder as three steps with the best clean run marked.
function renderLadderMeter(best) {
  return `<div class="ladder" aria-label="Tempo ladder${best ? `, best clean run ${best}%` : ''}">${TEMPO_LADDER.map((step) => (
    `<span class="ladder__step${best !== null && step <= best ? ' ladder__step--done' : ''}${step === best ? ' ladder__step--best' : ''}"><span class="ladder__dot"></span>${step}%</span>`
  )).join('<span class="ladder__line" aria-hidden="true"></span>')}</div>`;
}

// The part to practise: the learning or not-yet part with the lowest clean rate.
function weakestPart(state, song, entry) {
  const open = song.parts.filter((part) => partState(entry, part.id) !== 'got-it');
  if (!open.length) return null;
  return open
    .map((part) => ({ part, rate: cleanRate(state.reps, songItemId(song.id, part.id)).rate ?? -1 }))
    .sort((a, b) => a.rate - b.rate)[0].part;
}

// The empty state when nothing is being learned.
function renderEmpty(songCount) {
  return `
    <section class="panel empty-state rep-empty">
      ${renderArtPlaceholder('character', 'Empty CD rack', 'character:empty-repertoire')}
      <div>
        <h2 class="empty-state__title">${songCount ? 'Nothing in Learning right now' : 'No songs yet'}</h2>
        <p class="empty-state__text">${songCount ? 'Pick a suggestion below, or add a song you want to learn.' : 'Add your first song, or start from a suggestion below.'}</p>
        <a class="button button--primary" href="#/repertoire/add">Add your first song</a>
      </div>
    </section>`;
}

// One shelf of cases (hidden when empty).
function renderShelf(title, rows, state) {
  if (!rows.length) return '';
  const now = new Date();
  return `
    <section class="shelf">
      <h2 class="section-label">${title} · ${rows.length}</h2>
      <div class="shelf__row">${rows.map(({ song, entry }) => renderCdCase(song, {
        entry, href: `#/song/${song.id}`, note: isEncoreDue(song, entry, now) ? 'Encore due' : '',
      })).join('')}</div>
    </section>`;
}

// Suggestions: the unlock line, filter chips, the capo finder switch and the cases.
function renderSuggestions(state) {
  const capoFinder = Boolean(getSettings().capoFinder);
  const ranked = rankSuggestions(state, { capoFinder });
  const unlocks = unlockLines(ranked);
  const shown = ranked.filter((suggestion) => matchesFilter(suggestion, view.filter));
  const filters = [...FILTERS, ...SONG_SETS.filter((set) => set.id !== 'rock').map((set) => [`set:${set.id}`, set.label])];
  return `
    <section class="shelf suggestions">
      <h2 class="section-label">Suggestions</h2>
      ${unlocks.length ? `<ul class="unlock-list">${unlocks.map((line) => `
        <li class="unlock-line">Learn <a class="unlock-line__chord" href="${chordLink(line.chord)}">${escapeHtml(line.chord)}</a> → unlocks ${line.count} song${line.count === 1 ? '' : 's'}
          <button class="button" data-add-chord="${escapeHtml(line.chord)}">+ Add ${escapeHtml(line.chord)} to practice</button></li>`).join('')}</ul>` : ''}
      <div class="chip-row" role="group" aria-label="Filter suggestions">
        ${filters.map(([id, label]) => `<button class="chip" data-filter="${id}" aria-pressed="${view.filter === id}">${label}</button>`).join('')}
        <button class="chip" data-capo-finder aria-pressed="${capoFinder}">Capo finder</button>
      </div>
      ${shown.length ? `<div class="shelf__row">${shown.map((suggestion) => renderCdCase(suggestion.song, { href: `#/song/${suggestion.song.id}`, note: suggestionNote(suggestion) })).join('')}</div>`
        : '<p class="progress-empty">No suggestions match this filter.</p>'}
    </section>`;
}

// True when a suggestion passes the chosen filter chip.
function matchesFilter(suggestion, filter) {
  if (filter === 'all') return true;
  if (filter === 'ready' || filter === 'one-away') return suggestion.status === filter;
  if (filter.startsWith('set:')) return suggestion.song.set === filter.slice(4);
  return String(suggestion.song.level) === filter;
}

// The strip line under a suggestion: ready, the missing chord(s), or a capo that helps.
function suggestionNote({ status, missing, capo }) {
  if (capo) return `Capo ${capo.fret} → ${capo.shapes.join(' ')}`;
  if (status === 'ready') return 'Ready to play.';
  return `Missing: ${missing.join(' ')}`;
}

// Connects the overview's chips and buttons.
function bindOverview() {
  bindCdCases(page());
  page().querySelectorAll('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
    view.filter = chip.dataset.filter;
    renderOverview();
  }));
  const capo = page().querySelector('[data-capo-finder]');
  if (capo) capo.addEventListener('click', () => {
    updateSettings({ capoFinder: !getSettings().capoFinder });
    renderOverview();
  });
  page().querySelectorAll('[data-add-chord]').forEach((button) => button.addEventListener('click', () => {
    addChordToPractice(button.dataset.addChord);
    button.textContent = `${button.dataset.addChord} is in your practice`;
    button.disabled = true;
  }));
}

// Adds a chord's most common shape to practice (it shows up as a "Learn" opening).
function addChordToPractice(symbol) {
  const { root, quality } = parseChordSymbol(symbol);
  const voicing = thumbnailVoicing(root, quality);
  if (voicing) updateState((state) => ensureItem(state, voicingItem(voicing)));
}

// ─── One song ───

// The song page: header, parts, chords used, run-through, actions.
function renderSong(song, { action, partId }) {
  const state = getState();
  const entry = state.repertoire.songs[song.id] || null;
  const owned = Boolean(entry);
  const status = owned ? SONG_LABELS[songState(song, entry)] : 'Suggestion';
  page().innerHTML = `
    ${renderMetronomeBar({ expanded: view.metronomeOpen })}
    ${view.metronomeOpen ? renderMetronomePanel() : ''}
    <a class="back-link" href="#/repertoire">← Repertoire</a>
    <section class="song-head">
      <div class="song-head__case">${renderCdCase(song, { entry, size: 'hero', running: isRunning() })}</div>
      <div class="song-head__text">
        <span class="section-head__kicker">${escapeHtml(status)} · LV·${song.level} ${LEVEL_LABELS[song.level]}</span>
        <h1 class="section-head__title">${escapeHtml(song.title)}</h1>
        <p class="song-head__artist">${escapeHtml(song.artist || 'Artist not filled in yet')}${song.year ? ` · ${song.year}` : ''}</p>
        <dl class="song-facts">
          ${fact('Key', song.key || '–')}
          ${fact('Original tempo', song.bpm ? `${song.bpm} BPM` : 'not checked yet')}
          ${fact('Time', song.timeSignature || '4/4')}
          ${fact('Capo', (entry ? entry.capo : song.capo) ? `fret ${entry ? entry.capo : song.capo}` : 'none')}
        </dl>
        ${tuningNote(song)}
        ${song.source ? `<a class="song-head__source" href="${escapeHtml(song.source)}" target="_blank" rel="noopener">Chord sheet ↗</a>` : '<p class="label">No chord sheet linked yet.</p>'}
        <div class="measure__row">
          ${owned ? '' : `<button class="button button--primary" data-add-song="learning">Add: I'm learning it</button>
            <button class="button" data-add-song="known">Add: I already know this</button>`}
        </div>
      </div>
    </section>
    ${owned ? '' : '<p class="progress-empty">Add the song to track its parts and run-throughs.</p>'}
    <section class="panel">
      <h2 class="panel__title">Parts</h2>
      <ol class="song-parts">${song.parts.map((part) => renderPartRow(song, part, entry, partId)).join('')}</ol>
      ${song.parts.length && !song.parts.some((part) => part.bars) ? '<p class="label">Add the chords: edit the song and fill in each part\'s bars.</p>' : ''}
    </section>
    ${renderChordsUsed(song)}
    ${owned ? `<section class="panel" id="run-through"><h2 class="panel__title">Run-through</h2><div data-run-tool>${renderRunTool(song.id)}</div></section>` : ''}
    ${owned ? `<div class="measure__row song-actions">
      <a class="button" href="#/song/${song.id}/edit">Edit</a>
      <button class="button" data-remove-song>Remove song</button>
    </div>` : ''}`;
  bindSong(song, { action, partId });
}

// One fact in the song header.
function fact(label, value) {
  return `<div class="song-facts__item"><dt class="label">${label}</dt><dd>${escapeHtml(String(value))}</dd></div>`;
}

// A note about tuning when it isn't standard.
function tuningNote(song) {
  if (!song.tuning || song.tuning === 'standard') return '';
  if (song.tuning === 'half-step-down') return '<p class="song-head__note">Tuned half a step down: play the shapes as written.</p>';
  return `<p class="song-head__note">Tuning: ${escapeHtml(TUNINGS[song.tuning] || song.tuning)}.</p>`;
}

// One part: its bars as chord chips, the state switch and "Loop this part".
function renderPartRow(song, part, entry, loopingPartId) {
  const status = partState(entry, part.id);
  return `
    <li class="song-part" data-part="${status}" ${part.id === loopingPartId ? 'data-looping="true"' : ''}>
      <div class="song-part__head">
        <span class="song-part__name">${escapeHtml(part.name)}</span>
        ${entry ? `<span class="chip-row" role="group" aria-label="${escapeHtml(part.name)} state">${PART_STATES.map((option) => (
          `<button class="chip" data-part-state="${part.id}:${option}" aria-pressed="${status === option}">${PART_LABELS[option]}</button>`
        )).join('')}</span>` : ''}
      </div>
      ${renderBarChips(part)}
      ${part.bars ? `<button class="button" data-loop="${part.id}">${part.id === loopingPartId ? 'Looping: change tempo on the bar above' : 'Loop this part'}</button>` : ''}
    </li>`;
}

// The most common shape of every chord in the song (same rule as the Chords library).
function renderChordsUsed(song) {
  const chords = [...new Set(songChords(song).map(baseChord))];
  if (!chords.length) return '';
  const leftHanded = getSettings().leftHanded;
  const cards = chords.map((name) => {
    const { root, quality } = parseChordSymbol(name);
    const voicing = thumbnailVoicing(root, quality);
    return `<a class="chord-thumb" href="${chordLink(name)}">${voicing ? renderChordDiagram(voicing, { size: 110, leftHanded }) : ''}<span class="chord-thumb__name">${escapeHtml(name)}</span></a>`;
  }).join('');
  return `<section class="panel"><h2 class="panel__title">Chords used · ${chords.length}</h2><div class="chord-thumbs">${cards}</div></section>`;
}

// Connects the song page.
function bindSong(song, { action, partId }) {
  const root = page();
  const redraw = () => renderSong(song, { action: null, partId: currentLoop });
  let currentLoop = partId || null;
  bindCdCases(root);
  bindMetronomePanel(root, redraw, { onExpand: () => { view.metronomeOpen = !view.metronomeOpen; redraw(); } });
  root.querySelectorAll('[data-add-song]').forEach((button) => button.addEventListener('click', () => {
    updateState((state) => addSong(state, song, { known: button.dataset.addSong === 'known' }));
    renderSong(song, {});
  }));
  root.querySelectorAll('[data-part-state]').forEach((chip) => chip.addEventListener('click', () => {
    const [part, option] = chip.dataset.partState.split(':');
    updateState((state) => setPartState(state, song.id, part, option));
    redraw();
  }));
  root.querySelectorAll('[data-loop]').forEach((button) => button.addEventListener('click', () => {
    currentLoop = button.dataset.loop;
    startLoop(song, currentLoop);
    redraw();
  }));
  const runTool = root.querySelector('[data-run-tool]');
  if (runTool) {
    const logRun = (fields) => {
      updateState((state) => {
        state.reps.push({ id: makeId(), itemId: songItemId(song.id), sessionId: null, at: new Date().toISOString(), ...fields });
      });
      redraw();
    };
    bindSongTools(runTool, { songId: song.id }, logRun, redraw);
  }
  const remove = root.querySelector('[data-remove-song]');
  if (remove) remove.addEventListener('click', () => removeSong(song));
  if (action === 'loop' && partId) {
    startLoop(song, partId);
    root.querySelector(`[data-looping="true"]`)?.scrollIntoView({ block: 'center' });
  }
  if (action === 'run') root.querySelector('#run-through')?.scrollIntoView({ block: 'start' });
}

// Loops one part with the metronome at the song's next ladder step.
function startLoop(song, partId) {
  const part = song.parts.find((candidate) => candidate.id === partId);
  if (!part) return;
  const entry = getState().repertoire.songs[song.id];
  const best = bestCleanTempo(entry);
  loopPart(song, part, best === null ? TEMPO_LADDER[0] : Math.min(100, TEMPO_LADDER.find((step) => step > best) || 100));
}

// Removes a song from the repertoire after a confirmation (its reps stay in the history).
function removeSong(song) {
  if (!window.confirm(`Remove "${song.title}" from your repertoire? Its parts and run-throughs are deleted; your practice history stays.`)) return;
  updateState((state) => {
    delete state.repertoire.songs[song.id];
    delete state.repertoire.custom[song.id];
  });
  resetSongTool();
  navigate('#/repertoire');
}

// ─── Add / edit ───

// The form for a new song (song = null), your own song (everything editable), or a built-in
// song (only your capo, since the song data is shared and checked).
function renderSongForm(song) {
  const state = getState();
  const isOwn = !song || song.set === 'custom';
  const entry = song ? state.repertoire.songs[song.id] : null;
  const value = (key, fallback = '') => escapeHtml(song && song[key] !== undefined && song[key] !== null ? String(song[key]) : fallback);
  const parts = song ? song.parts : [{ id: 'verse', name: 'Verse', bars: '' }, { id: 'chorus', name: 'Chorus', bars: '' }];
  page().innerHTML = `
    <a class="back-link" href="${song ? `#/song/${song.id}` : '#/repertoire'}">← ${song ? escapeHtml(song.title) : 'Repertoire'}</a>
    <header class="page-head"><div class="section-head">
      <span class="section-head__kicker">Repertoire</span>
      <h1 class="section-head__title">${song ? `Edit ${escapeHtml(song.title)}` : 'Add a song'}</h1>
      ${!isOwn ? '<p class="section-head__lead">This song comes with Tempo, so its chords stay as checked. You can set the capo you use.</p>' : ''}
    </div></header>
    <form class="panel song-form" novalidate>
      ${isOwn ? `
        <div class="song-form__grid">
          ${field('Title', `<input name="title" required value="${value('title')}">`)}
          ${field('Artist', `<input name="artist" value="${value('artist')}">`)}
          ${field('Year', `<input name="year" type="number" min="1900" max="2100" value="${value('year')}">`)}
          ${field('Key', `<input name="key" placeholder="Am" value="${value('key')}">`)}
          ${field('Original BPM', `<input name="bpm" type="number" min="30" max="300" value="${value('bpm')}">`)}
          ${field('Time', `<select name="timeSignature">${['4/4', '3/4', '6/8', '2/4'].map((time) => `<option${(song ? song.timeSignature : '4/4') === time ? ' selected' : ''}>${time}</option>`).join('')}</select>`)}
          ${field('Tuning', `<select name="tuning">${Object.entries(TUNINGS).map(([id, label]) => `<option value="${id}"${(song ? song.tuning : 'standard') === id ? ' selected' : ''}>${label}</option>`).join('')}</select>`)}
          ${field('Capo', `<input name="capo" type="number" min="0" max="12" value="${value('capo', '0')}">`)}
          ${field('Level', `<select name="level">${[1, 2, 3].map((level) => `<option value="${level}"${(song ? song.level : 1) === level ? ' selected' : ''}>LV·${level} ${LEVEL_LABELS[level]}</option>`).join('')}</select>`)}
          ${field('Chord sheet link (optional)', `<input name="source" type="url" placeholder="https://" value="${value('source')}">`)}
        </div>
        <h2 class="panel__title">Parts</h2>
        <p class="label">Bars are chords separated by "|"; two chords in a bar split it. Tick "riff" for parts without chords.</p>
        <ol class="song-form__parts" data-parts>${parts.map((part) => renderPartField(part)).join('')}</ol>
        <button type="button" class="button" data-add-part>+ Add a part</button>
        ${song ? '' : '<label class="metro-check song-form__known"><input type="checkbox" name="known"> I already know this (every part starts as "got it")</label>'}`
      : field('Your capo', `<input name="capo" type="number" min="0" max="12" value="${escapeHtml(String(entry ? entry.capo : song.capo || 0))}">`)}
      <p class="song-form__error" role="alert" hidden></p>
      <div class="measure__row"><button class="button button--primary" type="submit">${song ? 'Save' : 'Add the song'}</button></div>
    </form>`;
  bindSongForm(song, isOwn);
}

// One labelled form field.
function field(label, control) {
  return `<label class="song-form__field"><span class="label">${label}</span>${control}</label>`;
}

// One part row in the form: name, bars, riff tick and a chord check.
function renderPartField(part) {
  const riff = part.type === 'riff' || (part.bars === undefined && part.type);
  return `
    <li class="song-form__part">
      <input name="part-name" aria-label="Part name" value="${escapeHtml(part.name || '')}" placeholder="Verse">
      <input name="part-bars" aria-label="Bars" value="${escapeHtml(part.bars || '')}" placeholder="Am | F | C | G" ${riff ? 'disabled' : ''}>
      <label class="metro-check"><input type="checkbox" name="part-riff" ${riff ? 'checked' : ''}> riff</label>
      <button type="button" class="button button--icon" data-remove-part aria-label="Remove this part">✕</button>
      <span class="song-form__warning" aria-live="polite"></span>
    </li>`;
}

// Connects the form: live chord checks, add/remove parts, riff ticks and saving.
function bindSongForm(song, isOwn) {
  const form = page().querySelector('form');
  const partsList = form.querySelector('[data-parts]');
  const checkRow = (row) => {
    const bars = row.querySelector('[name="part-bars"]');
    const unknown = bars.disabled ? [] : unknownChords(bars.value);
    row.querySelector('.song-form__warning').textContent = unknown.length ? `Tempo doesn't know ${unknown.join(', ')} yet. You can still save; those chords won't link to the library.` : '';
  };
  const bindRow = (row) => {
    row.querySelector('[name="part-bars"]').addEventListener('input', () => checkRow(row));
    row.querySelector('[name="part-riff"]').addEventListener('change', (event) => {
      row.querySelector('[name="part-bars"]').disabled = event.target.checked;
      checkRow(row);
    });
    row.querySelector('[data-remove-part]').addEventListener('click', () => row.remove());
  };
  if (partsList) {
    partsList.querySelectorAll('.song-form__part').forEach(bindRow);
    form.querySelector('[data-add-part]').addEventListener('click', () => {
      partsList.insertAdjacentHTML('beforeend', renderPartField({ name: '', bars: '' }));
      bindRow(partsList.lastElementChild);
    });
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isOwn) {
      updateState((state) => { if (state.repertoire.songs[song.id]) state.repertoire.songs[song.id].capo = Number(form.capo.value) || 0; });
      navigate(`#/song/${song.id}`);
      return;
    }
    const saved = readSongForm(form, song);
    if (saved.error) {
      const error = form.querySelector('.song-form__error');
      error.textContent = saved.error;
      error.hidden = false;
      return;
    }
    saveCustomSong(saved.song, { isNew: !song, known: Boolean(form.known && form.known.checked) });
  });
}

// Reads the form into a song object, or { error } when something required is missing.
function readSongForm(form, existing) {
  const title = form.title.value.trim();
  if (!title) return { error: 'The song needs a title.' };
  const parts = [...form.querySelectorAll('.song-form__part')].map((row, index) => {
    const name = row.querySelector('[name="part-name"]').value.trim() || `Part ${index + 1}`;
    const riff = row.querySelector('[name="part-riff"]').checked;
    const bars = row.querySelector('[name="part-bars"]').value.trim();
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'part'}-${index + 1}`;
    return riff || !bars ? { id, name, type: 'riff' } : { id, name, bars: parseBars(bars).map((bar) => bar.join(' ')).join(' | ') };
  });
  if (!parts.length) return { error: 'Add at least one part.' };
  const artist = form.artist.value.trim();
  const id = existing ? existing.id : `my-${`${artist}-${title}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  return {
    song: {
      id, title, artist, parts,
      year: Number(form.year.value) || null,
      key: form.key.value.trim(),
      bpm: Number(form.bpm.value) || null,
      timeSignature: form.timeSignature.value,
      tuning: form.tuning.value,
      capo: Number(form.capo.value) || 0,
      level: Number(form.level.value) || 1,
      techniques: [],
      source: form.source.value.trim(),
      verified: false,
      cover: { query: `${artist} ${title}`.trim() },
      coverUrl: existing ? existing.coverUrl || null : null,
    },
  };
}

// Saves a song you made, adds it to the repertoire, and looks up its cover in the background.
function saveCustomSong(song, { isNew, known }) {
  updateState((state) => {
    state.repertoire.custom[song.id] = song;
    if (isNew) addSong(state, song, { known });
    else {
      const entry = state.repertoire.songs[song.id];
      if (entry) for (const part of song.parts) if (!entry.parts[part.id]) entry.parts[part.id] = 'not-yet';
    }
  });
  navigate(`#/song/${song.id}`);
  if (!song.coverUrl) {
    lookupCoverOnline(song).then((found) => {
      if (!found) return;
      updateState((state) => {
        if (state.repertoire.custom[song.id]) Object.assign(state.repertoire.custom[song.id], { coverUrl: found.url, album: found.album });
      });
    }).catch(() => {});
  }
}

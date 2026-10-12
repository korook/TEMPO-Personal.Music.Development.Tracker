// The Chords page (TEMPO_PLAN.md 5.5), in two views:
//   #/chords/C     a category: an A–G picker, then every root in that letter with all its
//                  chord types as thumbnails (each showing the most common shape);
//   #/chord/Cmaj7  one chord: its notes, the neck with the chosen shape highlighted, the shape
//                  itself large, and every variation in a strip from the nut up the neck.

import { getVoicings } from '../chords/voicings.js';
import {
  CATEGORY_LETTERS,
  getCategory,
  categoryOfRoot,
  thumbnailVoicing,
  prettyAccidentals,
} from '../chords/library.js';
import { parseChordSymbol, chordTones, chordSymbol, getQuality, rootNameFor, QUALITY_ORDER } from '../theory/chords.js';
import { noteNameToPitchClass } from '../theory/notes.js';
import { displayLabel } from '../theory/intervals.js';
import { renderChordDiagram } from '../components/chord-diagram.js';
import { renderNeck } from '../components/neck.js';
import { playChord } from '../audio/guitar-synth.js';
import { getSettings } from '../state/settings.js';
import { getState, updateState } from '../state/storage.js';
import { voicingItem, voicingItemId, ensureItem } from '../practice/items.js';
import { CHORDS_V1 } from '../data/chords-v1.js';
import { chordLink } from '../router.js';
import { escapeHtml } from '../utils/html.js';

// Which voicing is shown large on the chord view, per chord symbol.
const chosenVoicing = new Map();
let keyListenerAdded = false;

// ─── Category view ───

// Draws a category: the A–G picker and every root in the letter with all its chord types.
export function renderChordsPage(letter = 'C') {
  const page = document.getElementById('pg-chords');
  const rows = getCategory(letter);
  page.innerHTML = `
    <header class="page-head">
      <div class="section-head">
        <span class="section-head__kicker">Chords · library</span>
        <h1 class="section-head__title section-head__title--hero">${letter} chords</h1>
        <p class="section-head__lead">Every chord type for ${rows.map((row) => row.label).join(' and ')}. Each card shows the most common shape; open one to see every way to play it up the neck.</p>
      </div>
      ${renderLetterPicker(letter)}
    </header>
    ${rows.map(renderRootRow).join('')}`;
}

// The seven letter keys, A to G. The current letter is pressed.
function renderLetterPicker(current) {
  return `
    <nav class="letter-picker" aria-label="Chord categories">
      ${CATEGORY_LETTERS.map((letter) => `<a class="letter-key" href="#/chords/${letter}"${letter === current ? ' aria-current="page"' : ''}>${letter}</a>`).join('')}
    </nav>`;
}

// One root (e.g. "C♯ / D♭") with a thumbnail for each of its chord types.
function renderRootRow(row) {
  return `
    <section class="root-row" aria-labelledby="root-${row.pitchClass}">
      <div class="root-row__head">
        <h2 class="root-row__title" id="root-${row.pitchClass}">${row.label}</h2>
        <span class="label">${row.chords.length} chord types</span>
      </div>
      <div class="chord-grid">${row.chords.map(renderThumbnail).join('')}</div>
    </section>`;
}

// One thumbnail: the chord name, its type and its most common shape.
function renderThumbnail(chord) {
  const voicing = thumbnailVoicing(chord.root, chord.quality);
  const where = voicing.shape === 'open' ? 'open' : `${shortShape(voicing)} · fr ${voicing.position}`;
  return `
    <a class="chord-card" href="${chordLink(chord.symbol)}" aria-label="${escapeHtml(prettyAccidentals(chord.symbol))}, ${chord.name}, ${where}">
      <span class="chord-card__name">${prettyAccidentals(chord.symbol)}</span>
      <span class="chord-card__type label">${chord.name}</span>
      ${renderChordDiagram(voicing, { size: 108, showIntervals: false, leftHanded: getSettings().leftHanded })}
      <span class="chord-card__where label">${where}</span>
    </a>`;
}

// Shortens a shape name for small labels: "A-form barre" → "A-form", "D-string root" → "D-root".
function shortShape(voicing) {
  if (voicing.shape === 'found') return 'found';
  return voicing.shape.replace(' barre', '').replace('-string root', '-root').replace(/^triad on .*/, 'triad');
}

// ─── Chord view ───

// Draws one chord with all of its variations. `symbol` comes from the address, e.g. "Cmaj7".
export function renderChordPage(symbol) {
  const page = document.getElementById('pg-chords');
  let chord;
  try {
    chord = parseChordSymbol(symbol);
  } catch {
    page.innerHTML = `<p class="section-head__lead">There's no chord called "${escapeHtml(symbol)}". <a href="#/chords/C">Back to the chord library</a></p>`;
    return;
  }

  const voicings = getVoicings(chord.root, chord.quality);
  const index = Math.min(chosenVoicing.get(symbol) || 0, voicings.length - 1);
  const voicing = voicings[index];
  const leftHanded = getSettings().leftHanded;
  const letter = categoryOfRoot(chord.root);

  page.innerHTML = `
    <header class="page-head">
      <a class="back-link" href="#/chords/${letter}">← ${letter} chords</a>
      <div class="chord-head">
        <div class="section-head">
          <span class="section-head__kicker">${getQuality(chord.quality).name} · ${voicings.length} ways to play it</span>
          <h1 class="section-head__title section-head__title--hero">${prettyAccidentals(chordSymbol(chord.root, chord.quality))}</h1>
        </div>
        ${renderTones(chord)}
      </div>
      ${renderTypeSwitcher(chord)}
    </header>
    <section class="chord-neck" aria-label="All chord tones on the neck">
      ${renderNeck(chord.root, chord.quality, { voicing, leftHanded })}
    </section>
    <section class="voicing-focus panel" aria-live="polite">
      ${renderFocus(voicing, index, voicings.length, leftHanded)}
    </section>
    <section aria-labelledby="strip-title">
      <div class="root-row__head">
        <h2 class="root-row__title" id="strip-title">Every variation</h2>
        <span class="label">from the nut up · ← → to step through</span>
      </div>
      ${renderStrip(voicings, index, leftHanded)}
    </section>`;

  bindChordPage(page, symbol, voicings);
}

// The chord's notes with their roles, e.g. C (R) · E (3) · G (5).
function renderTones(chord) {
  return `
    <ul class="tone-list" aria-label="Notes in the chord">
      ${chordTones(chord.root, chord.quality).map((tone) => `<li class="tone${tone.label === '1' ? ' tone--root' : ''}"><span class="tone__note">${prettyAccidentals(tone.note)}</span><span class="tone__role">${displayLabel(tone.label)}</span></li>`).join('')}
    </ul>`;
}

// Chips to switch to another type on the same root (C → Cm, C7, Cmaj7 ...), each spelled
// the usual way (Db major but C#m).
function renderTypeSwitcher(chord) {
  const pitchClass = noteNameToPitchClass(chord.root);
  return `
    <nav class="type-switcher" aria-label="Other chord types">
      ${QUALITY_ORDER.map((quality) => {
        const symbol = chordSymbol(rootNameFor(pitchClass, quality), quality);
        const current = quality === chord.quality ? ' aria-current="page"' : '';
        return `<a class="chip type-chip" href="${chordLink(symbol)}"${current}>${prettyAccidentals(symbol)}</a>`;
      }).join('')}
    </nav>`;
}

// The chosen shape, large, with its details and a play button.
function renderFocus(voicing, index, total, leftHanded) {
  const frets = voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join(' ');
  const tip = voicing.shape === 'open' && CHORDS_V1[voicing.symbol] ? CHORDS_V1[voicing.symbol].tip : '';
  const omitted = voicing.omitted.length
    ? `<li><span class="label">Left out</span><span>${voicing.omitted.map((label) => displayLabel(label)).join(', ')}</span></li>`
    : '';
  return `
    <div class="voicing-focus__diagram">${renderChordDiagram(voicing, { size: 220, leftHanded })}</div>
    <div class="voicing-focus__info">
      <span class="label">Shape ${index + 1} of ${total}</span>
      <h2 class="voicing-focus__name">${escapeHtml(prettyAccidentals(voicing.name))}</h2>
      <div class="voicing-focus__tags">
        <span class="chip chip--${voicing.source}">${voicing.source}</span>
        <span class="chip chip--${voicing.difficulty}">${voicing.difficulty}</span>
        ${voicing.stretch ? '<span class="chip chip--stretch">stretch</span>' : ''}
      </div>
      <ul class="spec-list">
        <li><span class="label">Frets</span><span class="mono">${frets}</span></li>
        <li><span class="label">Bass</span><span>${prettyAccidentals(voicing.bass)} · ${voicing.inversion}</span></li>
        <li><span class="label">Fingers</span><span>${voicing.fingerCount}${voicing.barre ? ` · barre at fret ${voicing.barre.fret}` : ''}</span></li>
        ${omitted}
      </ul>
      ${tip ? `<p class="voicing-focus__tip">${escapeHtml(tip)}</p>` : ''}
      <div class="voicing-focus__keys">
        <button class="button button--icon button--round" data-step="-1" aria-label="Previous shape">←</button>
        <button class="button button--primary" data-play>▶ Play</button>
        <button class="button button--icon button--round" data-step="1" aria-label="Next shape">→</button>
        ${getState().items[voicingItemId(voicing)]
          ? '<span class="label voicing-focus__added">In your practice ✓</span>'
          : '<button class="button" data-add-practice>+ Add to practice</button>'}
      </div>
    </div>`;
}

// Every voicing as a small card, standard shapes first, then found ones.
function renderStrip(voicings, chosenIndex, leftHanded) {
  const firstFound = voicings.findIndex((voicing) => voicing.source === 'found');
  return `
    <ol class="voicing-strip">
      ${voicings.map((voicing, index) => `
        ${index === firstFound ? '<li class="voicing-strip__divider" aria-hidden="true"><span class="label">found shapes</span></li>' : ''}
        <li>
          <button class="voicing-card" data-voicing="${index}" aria-pressed="${index === chosenIndex}" aria-label="${escapeHtml(prettyAccidentals(voicing.name))}">
            ${renderChordDiagram(voicing, { size: 104, showIntervals: false, leftHanded })}
            <span class="voicing-card__name">${voicing.shape === 'open' ? 'open' : shortShape(voicing)}</span>
            <span class="label">${voicing.position === 0 ? 'open pos.' : `fret ${voicing.position}`}${voicing.symbol.includes('/') ? ` · /${prettyAccidentals(voicing.bass)}` : ''}</span>
          </button>
        </li>`).join('')}
    </ol>`;
}

// ─── Events ───

// Connects the strip, the step keys, play, and the ← → keyboard shortcuts.
function bindChordPage(page, symbol, voicings) {
  page.querySelectorAll('[data-voicing]').forEach((card) => {
    card.addEventListener('click', () => chooseVoicing(symbol, Number(card.dataset.voicing)));
  });
  page.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => stepVoicing(symbol, voicings.length, Number(button.dataset.step)));
  });
  page.querySelector('[data-play]').addEventListener('click', () => {
    playChord(voicings[chosenVoicing.get(symbol) || 0].frets);
  });
  const addButton = page.querySelector('[data-add-practice]');
  if (addButton) {
    addButton.addEventListener('click', () => {
      updateState((state) => ensureItem(state, voicingItem(voicings[chosenVoicing.get(symbol) || 0])));
      chooseVoicing(symbol, chosenVoicing.get(symbol) || 0);
    });
  }

  const chosen = page.querySelector('.voicing-card[aria-pressed="true"]');
  const strip = page.querySelector('.voicing-strip');
  if (chosen && strip) strip.scrollLeft = chosen.offsetLeft - strip.clientWidth / 2 + chosen.offsetWidth / 2;

  if (!keyListenerAdded) {
    keyListenerAdded = true;
    document.addEventListener('keydown', handleArrowKeys);
  }
}

// Shows voicing `index` large and on the neck, keeping the page where it is.
function chooseVoicing(symbol, index) {
  const scroll = window.scrollY;
  chosenVoicing.set(symbol, index);
  renderChordPage(symbol);
  window.scrollTo(0, scroll);
}

// Moves to the previous or next voicing, wrapping around at the ends.
function stepVoicing(symbol, total, step) {
  const index = ((chosenVoicing.get(symbol) || 0) + step + total) % total;
  chooseVoicing(symbol, index);
}

// ← and → step through the voicings while a chord is open.
function handleArrowKeys(event) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  if (event.target.closest && event.target.closest('input, select, textarea')) return;
  const match = /^#\/chord\/(.+)$/.exec(location.hash);
  if (!match) return;
  event.preventDefault();
  const symbol = decodeURIComponent(match[1]);
  let chord;
  try {
    chord = parseChordSymbol(symbol);
  } catch {
    return; // a broken chord link: nothing to step through
  }
  stepVoicing(symbol, getVoicings(chord.root, chord.quality).length, event.key === 'ArrowRight' ? 1 : -1);
}

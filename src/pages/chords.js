// The Guitar page (becomes "Chords" in Phase 4): chord grid by category and a detail
// panel with diagram, notes, tip, songs and the v1 "+10% / −10%" mastery buttons.
// The +10% model and song lists are removed in later phases (TEMPO_PLAN.md sections 5–6).

import { CHORDS_V1, STRING_NAMES, STRING_COLOURS } from '../data/chords-v1.js';
import { loadChordProgress, saveChordProgress } from '../state/storage.js';
import { renderGreeting } from '../components/header.js';
import { renderChordDiagram } from '../components/chord-diagram.js';

let selectedChord = 'C';

// ─── Selection ───

// Sets which chord the detail panel shows next time the page is drawn.
export function selectChord(chordKey) {
  selectedChord = chordKey;
}

// ─── Rendering ───

// Draws the chord grid (Major, Minor, 7th) and the detail panel for the selected chord.
export function renderChordsPage() {
  renderGreeting();
  const page = document.getElementById('pg-guitar');
  const categories = groupChordsByCategory();

  page.innerHTML = Object.entries(categories).map(([category, chordKeys]) => `
    <div class="sec">${category} chords</div>
    <div class="cg">${chordKeys.map(renderChordCard).join('')}</div>
  `).join('') + '<div class="detail" id="cDet"></div>';

  page.querySelectorAll('[data-chord]').forEach((card) => {
    card.addEventListener('click', () => {
      selectChord(card.dataset.chord);
      renderChordsPage();
    });
  });
  renderChordDetail();
}

// Sorts the chords into Major, Minor and 7th by their type text.
function groupChordsByCategory() {
  const categories = { Major: [], Minor: [], '7th': [] };
  Object.entries(CHORDS_V1).forEach(([chordKey, chord]) => {
    if (chord.type.includes('7')) categories['7th'].push(chordKey);
    else if (chord.type.includes('Minor')) categories.Minor.push(chordKey);
    else categories.Major.push(chordKey);
  });
  return categories;
}

// Returns one small chord card: name, type, difficulty badge and a mini diagram.
function renderChordCard(chordKey) {
  const chord = CHORDS_V1[chordKey];
  const selectedClass = selectedChord === chordKey ? ' sel' : '';
  return `<div class="cc${selectedClass}" data-chord="${chordKey}"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="cn">${chord.name}</div><div class="ct">${chord.type}</div></div><span class="diff diff-${chord.difficulty}">${chord.difficulty}</span></div><div style="margin-top:8px">${renderChordDiagram(chordKey, 110)}</div></div>`;
}

// Draws the detail panel: big diagram, fret per string, notes, mastery, tip and songs.
function renderChordDetail() {
  const panel = document.getElementById('cDet');
  if (!panel) return;

  const chord = CHORDS_V1[selectedChord];
  const percent = loadChordProgress()[selectedChord] || 0;
  const colour = percent >= 80 ? 'var(--green)' : percent >= 40 ? 'var(--amber)' : 'var(--blue)';

  panel.innerHTML = `
    <div class="fb-panel">
      <div style="font-family:var(--serif);font-size:28px">${chord.name}</div>
      <div style="font-size:12px;color:var(--tx3);margin-bottom:14px">${chord.type}</div>
      ${renderChordDiagram(selectedChord, 240)}
      <div class="sdots" style="margin-top:12px">${renderFretPerString(chord)}</div>
      <div style="font-size:10px;color:var(--tx3);margin-top:6px;font-family:var(--mono)">fret per string</div>
    </div>
    <div class="info-p">
      <div class="irow"><span class="k">Notes</span><span class="v" style="font-family:var(--mono)">${chord.notes}</span></div>
      <div class="irow"><span class="k">Difficulty</span><span class="v"><span class="diff diff-${chord.difficulty}">${chord.difficulty}</span></span></div>
      <div class="irow"><span class="k">Mastery</span><span class="v" style="color:${colour}">${percent}%</span></div>
      <div style="margin-top:8px"><div class="pb" style="height:6px"><div class="pf" style="width:${percent}%;background:${colour}"></div></div></div>
      <div class="tip">${chord.tip}</div>
      <div style="margin-top:12px;font-size:12px;color:var(--tx3);font-weight:600">Songs using this chord</div>
      <div class="songs">${chord.songs.map((song) => `<span class="stag">${song}</span>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn" style="flex:1" data-change="10">Practice +10%</button>
        <button class="btn" style="flex:0 0 90px;color:var(--accent)" data-change="-10">−10%</button>
      </div>
    </div>`;

  panel.querySelectorAll('[data-change]').forEach((button) => {
    button.addEventListener('click', () => changeMastery(selectedChord, Number(button.dataset.change)));
  });
}

// Returns six round badges showing the fret played on each string (✕ if not played).
function renderFretPerString(chord) {
  return STRING_NAMES.map((_, string) => {
    const fret = chord.frets[string];
    const background = fret === 'x' ? '#333' : STRING_COLOURS[string];
    const opacity = fret === 'x' ? '.4' : '.85';
    return `<div class="sdot" style="background:${background};opacity:${opacity}">${fret === 'x' ? '✕' : fret}</div>`;
  }).join('');
}

// ─── Actions ───

// Adds `delta` to the chord's self-rated %, kept between 0 and 100, then redraws.
function changeMastery(chordKey, delta) {
  const progress = loadChordProgress();
  progress[chordKey] = Math.max(0, Math.min(100, (progress[chordKey] || 0) + delta));
  saveChordProgress(progress);
  renderChordsPage();
}

// The chord library's public entry point: every voicing of a chord, described and ordered.
//
// getVoicings('C', 'major') returns standard shapes first (open, CAGED, barre, triads,
// power), then the best "found" shapes, each list ordered from the nut up the neck.
// Each voicing:
//   { id, symbol, root, quality, name, frets, fingers, barre, damped, intervals, notes,
//     bass, inversion, omitted, position, startFret, span, stretch, fingerCount,
//     difficulty, source, shape, form }
// position: 0 = open position (open strings, first 4 frets), otherwise the lowest fretted fret.

import { chordSymbol, chordTones, parseChordSymbol, getQuality } from '../theory/chords.js';
import { displayLabel } from '../theory/intervals.js';
import { findBarre, countFingers } from './fingering.js';
import { fretKey } from './shapes.js';
import {
  openVoicings,
  movableVoicings,
  triadVoicings,
  searchVoicings,
  pitchClassAt,
  fretSpan,
  STRETCH_SPAN,
} from './generator.js';

const FOUND_PER_POSITION = 2;
const cache = new Map();

// ─── Public API ───

// Returns every voicing of a chord: standard shapes, then the best found shapes.
// Pass { found: false } to skip the (slower) search.
export function getVoicings(root, quality, { found = true } = {}) {
  const cacheKey = `${chordSymbol(root, quality)}|${found}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, buildVoicings(root, quality, found));
  return cache.get(cacheKey);
}

// Same as getVoicings, but takes a chord symbol such as "F#m7".
export function getVoicingsForSymbol(symbol, options) {
  const { root, quality } = parseChordSymbol(symbol);
  return getVoicings(root, quality, options);
}

// Returns the first standard voicing whose frets match, e.g. findVoicing('C', 'major', 'x32010').
export function findVoicing(root, quality, fretText) {
  const wanted = [...fretText].map((char) => (char === 'x' ? null : Number(char)));
  return getVoicings(root, quality, { found: false }).find((voicing) => fretKey(voicing.frets) === fretKey(wanted)) || null;
}

// ─── Building the list ───

// Collects, describes, de-duplicates and orders all voicings for one chord.
function buildVoicings(root, quality, includeFound) {
  const seen = new Set();
  const standard = [];
  for (const raw of [...openVoicings(root, quality), ...movableVoicings(root, quality), ...triadVoicings(root, quality)]) {
    const key = fretKey(raw.frets);
    if (seen.has(key)) continue;
    seen.add(key);
    standard.push(describeVoicing(raw, root, quality));
  }
  standard.sort(byPosition);
  if (!includeFound) return standard;

  const found = searchVoicings(root, quality)
    .filter((raw) => !seen.has(fretKey(raw.frets)))
    .map((raw) => describeVoicing(raw, root, quality));
  return [...standard, ...pickBestPerPosition(found).sort(byPosition)];
}

// Keeps the easiest few found voicings at each position, so the list stays useful.
function pickBestPerPosition(voicings) {
  const byFret = new Map();
  for (const voicing of voicings) {
    if (!byFret.has(voicing.position)) byFret.set(voicing.position, []);
    byFret.get(voicing.position).push(voicing);
  }
  const kept = [];
  for (const group of byFret.values()) {
    group.sort((a, b) => playabilityScore(a) - playabilityScore(b));
    kept.push(...group.slice(0, FOUND_PER_POSITION));
  }
  return kept;
}

// Orders voicings from the nut up the neck. At the same position, full open chords come
// first, then CAGED / barre / power shapes, then triads; easier before harder.
function byPosition(a, b) {
  return a.position - b.position
    || shapeRank(a) - shapeRank(b)
    || playabilityScore(a) - playabilityScore(b);
}

// Sorting rank by shape family (lower comes first).
function shapeRank(voicing) {
  if (voicing.shape === 'open') return 0;
  if (voicing.shape.startsWith('triad')) return 2;
  if (voicing.source === 'found') return 3;
  return 1;
}

// ─── Describing one voicing ───

// Turns a raw shape into a full voicing record with names, intervals and difficulty.
export function describeVoicing(raw, root, quality) {
  const tones = chordTones(root, quality);
  const toneAt = (string) => {
    const fret = raw.frets[string];
    return fret === null ? null : tones.find((tone) => tone.pitchClass === pitchClassAt(string, fret)) || null;
  };
  const stringTones = raw.frets.map((_, string) => toneAt(string));
  const bassString = raw.frets.findIndex((fret) => fret !== null);
  const bassTone = stringTones[bassString];
  const presentLabels = new Set(stringTones.filter(Boolean).map((tone) => tone.label));

  const symbol = chordSymbol(root, quality, bassTone && bassTone.label !== '1' ? bassTone.note : null);
  const span = fretSpan(raw.frets);
  const barre = findBarre(raw.frets, raw.fingers);
  const fingerCount = countFingers(raw.fingers);
  const position = handPosition(raw.frets);
  const inversion = inversionName(bassTone);

  const voicing = {
    id: `${chordSymbol(root, quality)}|${fretKey(raw.frets)}`,
    symbol,
    root,
    quality,
    name: '',
    frets: raw.frets,
    fingers: raw.fingers,
    barre,
    damped: raw.damped,
    intervals: stringTones.map((tone) => (tone ? displayLabel(tone.label) : null)),
    notes: stringTones.map((tone) => (tone ? tone.note : null)),
    bass: bassTone ? bassTone.note : null,
    inversion,
    omitted: tones.map((tone) => tone.label).filter((label) => !presentLabels.has(label)),
    position,
    startFret: Math.max(...raw.frets.filter(Number.isInteger)) <= 4 ? 1 : position,
    span,
    stretch: span === STRETCH_SPAN,
    fingerCount,
    difficulty: 'easy',
    source: raw.source,
    shape: raw.shape,
    form: raw.form,
  };
  voicing.difficulty = difficultyOf(voicing);
  voicing.name = voicingName(voicing);
  return voicing;
}

// Returns where the hand sits: 0 for "open position" (uses open strings and stays within
// the first 4 frets), otherwise the lowest fretted fret.
function handPosition(frets) {
  const fretted = frets.filter((fret) => Number.isInteger(fret) && fret > 0);
  const usesOpenStrings = frets.includes(0);
  if (fretted.length === 0 || (usesOpenStrings && Math.max(...fretted) <= 4)) return 0;
  return Math.min(...fretted);
}

// Names the inversion from the bass note's role: root position, 1st, 2nd or 3rd inversion.
function inversionName(bassTone) {
  if (!bassTone) return null;
  const label = bassTone.label;
  if (label === '1') return 'root position';
  if (['3', 'b3'].includes(label)) return '1st inversion';
  if (['5', 'b5', '#5'].includes(label)) return '2nd inversion';
  if (['7', 'b7'].includes(label)) return '3rd inversion';
  return `${label} in the bass`;
}

// Builds the display name, e.g. "C — A-form barre, fret 3" or "C/E — triad on G–B–e, 1st inversion, fret 5".
function voicingName(voicing) {
  const parts = [voicing.shape === 'found' ? 'found' : voicing.shape];
  if (voicing.inversion && voicing.inversion !== 'root position') parts.push(voicing.inversion);
  let where = `, fret ${voicing.position}`;
  if (voicing.shape === 'open') where = '';
  else if (voicing.position === 0) where = ', open position';
  return `${voicing.symbol} — ${parts.join(', ')}${where}`;
}

// ─── Difficulty ───

// Rates a voicing easy / medium / hard from barre, span, fingers, stretch and damped strings.
function difficultyOf(voicing) {
  const points = (voicing.barre ? 2 : 0)
    + Math.max(0, voicing.span - 3)
    + Math.max(0, voicing.fingerCount - 3)
    + (voicing.stretch ? 2 : 0)
    + (voicing.damped.length ? 1 : 0);
  if (points === 0) return 'easy';
  if (points <= 2) return 'medium';
  return 'hard';
}

// Lower is easier. Used to rank found shapes and to order shapes at the same fret.
function playabilityScore(voicing) {
  const sounding = voicing.frets.filter((fret) => fret !== null).length;
  const openStrings = voicing.frets.filter((fret) => fret === 0).length;
  return voicing.span
    + voicing.fingerCount
    + (voicing.barre ? 1.5 : 0)
    + (voicing.stretch ? 3 : 0)
    + (voicing.inversion === 'root position' ? 0 : 2)
    + (openStrings > 0 && voicing.position > 4 ? 1.5 : 0)
    - sounding * 0.5;
}

// ─── Checks used by tests ───

// Returns the tone labels a voicing must contain for its chord quality.
export function requiredLabels(quality) {
  return getQuality(quality).required;
}

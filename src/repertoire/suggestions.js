// Song suggestions (TEMPO_UPDATE_REPERTOIRE.md 5). Ranked by what you can already play:
//   1. Ready now: every chord is one you play.
//   2. One chord away: exactly one chord missing ("Missing: Bm").
//   3. Then lower levels first, then songs that bring a technique you don't have yet.
// "Plays" = a chord-shape practice item at status Steady or better (plan 6.7), or any chord
// in a song that is Played through or Stage-ready. Songs already in the repertoire are hidden.

import { POOL_SONGS, songChords, chordKey, shapesWithCapo, baseChord } from './songs.js';
import { repertoireSongs } from './state.js';
import { itemStatus, STATUS_ORDER } from '../practice/status.js';

export const CAPO_FRETS = [1, 2, 3, 4, 5, 6, 7];
const STEADY = STATUS_ORDER.indexOf('Steady');

// ─── What you play ───

// The chords you play, as chordKey ids ("0:major" …), each with a display name.
// Returns a Map: key → name.
export function knownChords(state) {
  const known = new Map();
  for (const item of Object.values(state.items)) {
    if (item.type !== 'voicing') continue;
    if (STATUS_ORDER.indexOf(itemStatus(item, state.reps).label) < STEADY) continue;
    const key = chordKey(item.chord);
    if (key) known.set(key, item.chord);
  }
  for (const row of repertoireSongs(state)) {
    if (row.state === 'learning') continue;
    for (const name of songChords(row.song)) {
      const key = chordKey(name);
      if (key && !known.has(key)) known.set(key, baseChord(name));
    }
  }
  return known;
}

// The chords of a song you don't play yet (plain names, no bass notes).
export function missingChords(song, known) {
  const missing = [];
  const seen = new Set();
  for (const name of songChords(song)) {
    const key = chordKey(name);
    if (known.has(key) || seen.has(key)) continue;
    seen.add(key);
    missing.push(baseChord(name));
  }
  return missing;
}

// ─── Suggestions ───

// Ranks the pool for you: [{ song, missing, status: 'ready' | 'one-away' | 'more', newTechniques, capo }].
// `capo` (only with capoFinder on and chords missing) = { fret, shapes } for the lowest capo
// position that moves every chord onto ones you play.
export function rankSuggestions(state, { capoFinder = false, pool = POOL_SONGS } = {}) {
  const known = knownChords(state);
  const owned = new Set(Object.keys(state.repertoire.songs));
  const myTechniques = new Set(repertoireSongs(state).flatMap((row) => row.song.techniques || []));
  return pool
    .filter((song) => !owned.has(song.id))
    .map((song) => {
      const missing = missingChords(song, known);
      const status = missing.length === 0 ? 'ready' : missing.length === 1 ? 'one-away' : 'more';
      const newTechniques = (song.techniques || []).filter((technique) => !myTechniques.has(technique));
      return { song, missing, status, newTechniques, capo: capoFinder && missing.length ? findCapo(song, known) : null };
    })
    .sort(compareSuggestions);
}

// Orders suggestions: ready, then one away, then the rest; lower level first; new techniques first.
function compareSuggestions(a, b) {
  const rank = { ready: 0, 'one-away': 1, more: 2 };
  return rank[a.status] - rank[b.status]
    || a.song.level - b.song.level
    || b.newTechniques.length - a.newTechniques.length
    || a.missing.length - b.missing.length
    || a.song.title.localeCompare(b.song.title);
}

// Looks for a capo position (1–7) that puts the whole song on chords you play.
// Returns { fret, shapes } or null.
export function findCapo(song, known) {
  const chords = songChords(song).map(baseChord);
  for (const fret of CAPO_FRETS) {
    const shapes = shapesWithCapo(chords, fret);
    if (shapes.every((name) => known.has(chordKey(name)))) return { fret, shapes: [...new Set(shapes)] };
  }
  return null;
}

// ─── Unlock lines ───

// The missing chords that open up the most "one chord away" songs:
// [{ chord, count, songs }] most useful first ("Learn Bm → unlocks 3 songs").
export function unlockLines(suggestions, { limit = 3 } = {}) {
  const byChord = new Map();
  for (const suggestion of suggestions) {
    if (suggestion.status !== 'one-away') continue;
    const [chord] = suggestion.missing;
    if (!byChord.has(chord)) byChord.set(chord, []);
    byChord.get(chord).push(suggestion.song);
  }
  return [...byChord.entries()]
    .map(([chord, songs]) => ({ chord, count: songs.length, songs }))
    .sort((a, b) => b.count - a.count || a.chord.localeCompare(b.chord))
    .slice(0, limit);
}

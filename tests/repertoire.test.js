// Tests for the Repertoire update (TEMPO_UPDATE_REPERTOIRE.md 11): song data, song states,
// suggestions and the unlock line, the capo finder, and the v2 → v3 migration.

import { describe, it, expect } from 'vitest';
import { BUILT_IN_SONGS, POOL_SONGS, parseBars, unknownChords, songChords, transposeChord, shapesWithCapo, chordKey } from '../src/repertoire/songs.js';
import { addSong, setPartState, recordRun, songState, nextPart, progressLine, isEncoreDue, nowLearning } from '../src/repertoire/state.js';
import { rankSuggestions, unlockLines, findCapo, knownChords } from '../src/repertoire/suggestions.js';
import { createEmptyState, normalizeState, SCHEMA_VERSION } from '../src/state/storage.js';

const NOW = new Date('2026-11-07T18:00:00Z');
const DAY_MS = 864e5;

// A small made-up song for the state tests.
const SONG = {
  id: 'test-song', title: 'Test Song', artist: 'Nobody', level: 1, key: 'G', bpm: 90, timeSignature: '4/4',
  tuning: 'standard', capo: 0, techniques: ['strumming'],
  parts: [
    { id: 'verse', name: 'Verse', bars: 'G | D | Em | C' },
    { id: 'chorus', name: 'Chorus', bars: 'C | G | D | D' },
  ],
};

// A state with no own songs, so suggestion tests start clean.
function emptyRepertoireState() {
  const state = createEmptyState(NOW);
  state.repertoire.songs = {};
  return state;
}

// ─── Song data ───

describe('song data', () => {
  it('every chord in every song parses in the chord engine, and every part has bars or is a riff', () => {
    for (const song of BUILT_IN_SONGS) {
      expect(song.parts.length, song.id).toBeGreaterThan(0);
      for (const part of song.parts) {
        if (part.bars === undefined) {
          expect(part.type, `${song.id} · ${part.id}`).toBe('riff');
          continue;
        }
        expect(unknownChords(part.bars), `${song.id} · ${part.id}`).toEqual([]);
        expect(parseBars(part.bars).every((bar) => bar.length >= 1), `${song.id} · ${part.id}`).toBe(true);
      }
    }
  });

  it('every pool song has a source link, is verified, and has a level 1–3', () => {
    for (const song of POOL_SONGS) {
      expect(song.source, song.id).toMatch(/^https:\/\//);
      expect(song.verified, song.id).toBe(true);
      expect([1, 2, 3], song.id).toContain(song.level);
    }
  });

  it('song ids are unique', () => {
    const ids = BUILT_IN_SONGS.map((song) => song.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('works out a chord set, once per chord, ignoring the bass note', () => {
    const song = { parts: [{ bars: 'Em | C | G | D/F#' }, { bars: 'D | Em C' }] };
    expect(songChords(song)).toEqual(['Em', 'C', 'G', 'D/F#']);
    expect(parseBars('Am | F G')).toEqual([['Am'], ['F', 'G']]);
    expect(unknownChords('Am | Xyz7')).toEqual(['Xyz7']);
  });
});

// ─── Song states ───

describe('song states', () => {
  it('is Learning until every part is got, then Played through', () => {
    const state = emptyRepertoireState();
    addSong(state, SONG, { now: NOW });
    const entry = state.repertoire.songs[SONG.id];
    expect(songState(SONG, entry)).toBe('learning');
    expect(progressLine(SONG, entry)).toBe('0 of 2 parts down. The verse is next.');
    setPartState(state, SONG.id, 'verse', 'got-it', NOW);
    setPartState(state, SONG.id, 'chorus', 'learning', NOW);
    expect(nextPart(SONG, entry).id).toBe('chorus');
    expect(progressLine(SONG, entry)).toBe('1 of 2 parts down. The chorus is next.');
    setPartState(state, SONG.id, 'chorus', 'got-it', NOW);
    expect(songState(SONG, entry)).toBe('played-through');
  });

  it('"I already know this" starts as Played through', () => {
    const state = emptyRepertoireState();
    addSong(state, SONG, { known: true, now: NOW });
    expect(songState(SONG, state.repertoire.songs[SONG.id])).toBe('played-through');
  });

  it('two clean runs at 100% on different days make it Stage-ready; a run with stops drops it back', () => {
    const state = emptyRepertoireState();
    addSong(state, SONG, { known: true, now: NOW });
    const entry = state.repertoire.songs[SONG.id];
    recordRun(state, SONG.id, { tempoPct: 100, stops: 0 }, NOW);
    recordRun(state, SONG.id, { tempoPct: 100, stops: 0 }, new Date(NOW.getTime() + 60000));
    expect(songState(SONG, entry)).toBe('played-through');
    recordRun(state, SONG.id, { tempoPct: 85, stops: 0 }, new Date(NOW.getTime() + DAY_MS));
    expect(songState(SONG, entry)).toBe('played-through');
    recordRun(state, SONG.id, { tempoPct: 100, stops: 0 }, new Date(NOW.getTime() + DAY_MS));
    expect(songState(SONG, entry)).toBe('stage-ready');
    recordRun(state, SONG.id, { tempoPct: 100, stops: 2 }, new Date(NOW.getTime() + 2 * DAY_MS));
    expect(songState(SONG, entry)).toBe('played-through');
  });

  it('a Stage-ready song comes back as an encore once its interval passes', () => {
    const state = emptyRepertoireState();
    addSong(state, SONG, { known: true, now: NOW });
    recordRun(state, SONG.id, { tempoPct: 100, stops: 0 }, NOW);
    recordRun(state, SONG.id, { tempoPct: 100, stops: 0 }, new Date(NOW.getTime() + DAY_MS));
    const entry = state.repertoire.songs[SONG.id];
    expect(isEncoreDue(SONG, entry, new Date(NOW.getTime() + 2 * DAY_MS))).toBe(false);
    expect(isEncoreDue(SONG, entry, new Date(NOW.getTime() + 30 * DAY_MS))).toBe(true);
  });

  it('picks the most recently touched song that is not Stage-ready as Now learning', () => {
    const state = createEmptyState(NOW);
    setPartState(state, 'adamlar-koca-yasli-sisko-dunya', 'chorus', 'learning', new Date(NOW.getTime() + 1000));
    expect(nowLearning(state).song.id).toBe('adamlar-koca-yasli-sisko-dunya');
  });
});

// ─── Suggestions ───

describe('suggestions', () => {
  const pool = [
    { ...SONG, id: 'ready', title: 'Ready', parts: [{ id: 'a', bars: 'G | D | Em | C' }] },
    { ...SONG, id: 'one', title: 'One', parts: [{ id: 'a', bars: 'G | Bm | C' }] },
    { ...SONG, id: 'one-b', title: 'One B', parts: [{ id: 'a', bars: 'Bm | D | G' }] },
    { ...SONG, id: 'two', title: 'Two', parts: [{ id: 'a', bars: 'F | Bb | G' }] },
  ];

  // A state where G, D, Em and C are known through a Played through song.
  function stateKnowingGDEmC() {
    const state = emptyRepertoireState();
    state.repertoire.custom['known'] = { ...SONG, id: 'known' };
    addSong(state, { ...SONG, id: 'known' }, { known: true, now: NOW });
    return state;
  }

  it('ranks ready-now songs first, then one chord away, with the missing chord named', () => {
    const state = stateKnowingGDEmC();
    expect([...knownChords(state).keys()].sort()).toEqual([chordKey('C'), chordKey('D'), chordKey('Em'), chordKey('G')].sort());
    const ranked = rankSuggestions(state, { pool });
    expect(ranked.map((row) => [row.song.id, row.status])).toEqual([['ready', 'ready'], ['one', 'one-away'], ['one-b', 'one-away'], ['two', 'more']]);
    expect(ranked[1].missing).toEqual(['Bm']);
  });

  it('counts how many songs a missing chord unlocks', () => {
    const lines = unlockLines(rankSuggestions(stateKnowingGDEmC(), { pool }));
    expect(lines[0]).toMatchObject({ chord: 'Bm', count: 2 });
  });

  it('hides songs already in the repertoire', () => {
    const state = stateKnowingGDEmC();
    addSong(state, pool[0], { now: NOW });
    expect(rankSuggestions(state, { pool }).map((row) => row.song.id)).not.toContain('ready');
  });
});

// ─── Capo finder ───

describe('capo finder', () => {
  it('transposes in sharp and flat keys', () => {
    expect(shapesWithCapo(['Bb', 'Eb', 'F'], 3)).toEqual(['G', 'C', 'D']);
    expect(shapesWithCapo(['F#m', 'D', 'A', 'E'], 2)).toEqual(['Em', 'C', 'G', 'D']);
    expect(transposeChord('D/F#', 2)).toBe('E/G#');
    expect(transposeChord('Am', 1)).toBe('Bbm');
  });

  it('finds the capo that moves a song onto chords you play', () => {
    const known = new Map(['G', 'C', 'D', 'Em'].map((name) => [chordKey(name), name]));
    const song = { parts: [{ bars: 'Bb | Eb | F | Gm' }] };
    expect(findCapo(song, known)).toEqual({ fret: 3, shapes: ['G', 'C', 'D', 'Em'] });
    expect(findCapo({ parts: [{ bars: 'B | F' }] }, known)).toBeNull();
  });
});

// ─── Migration ───

describe('storage v3', () => {
  it('keeps every bit of v2 data and adds the repertoire with Baranay\'s songs', () => {
    const v2 = {
      schemaVersion: 2,
      settings: { name: 'Baranay', theme: 'night' },
      items: { 'voicing:C': { id: 'voicing:C', type: 'voicing', chord: 'C' } },
      reps: [{ id: 'r1', itemId: 'voicing:C', kind: 'clean-check', clean: true }],
      sessions: [{ id: 's1', minutes: 12 }],
      milestones: [{ id: 'first-session', at: NOW.toISOString() }],
      ear: { results: [{ exercise: 'intervals' }] },
      theory: { results: [{ topic: '01' }] },
      meta: { createdAt: NOW.toISOString(), notices: { x: 1 } },
    };
    const v3 = normalizeState(JSON.parse(JSON.stringify(v2)));
    expect(v3.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(3);
    expect(v3.items).toEqual(v2.items);
    expect(v3.reps).toEqual(v2.reps);
    expect(v3.sessions).toEqual(v2.sessions);
    expect(v3.milestones).toEqual(v2.milestones);
    expect(v3.ear).toEqual(v2.ear);
    expect(v3.theory).toEqual(v2.theory);
    expect(v3.settings.theme).toBe('night');
    expect(v3.settings.capoFinder).toBe(false);
    expect(Object.keys(v3.repertoire.songs).sort()).toEqual(['adamlar-koca-yasli-sisko-dunya', 'rhcp-californication', 'son-feci-bisiklet-pazar-ve-ertesi']);
    expect(normalizeState(JSON.parse(JSON.stringify(v3))).repertoire).toEqual(v3.repertoire);
  });
});

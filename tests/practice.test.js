// Tests for the practice model (TEMPO_PLAN.md section 6): measurements, spacing,
// openings ("there is always a next step") and sessions.

import { describe, it, expect } from 'vitest';
import { createEmptyState } from '../src/state/storage.js';
import {
  cleanRate,
  formTimeSeconds,
  changesSummary,
  cleanBpmBest,
  mistakeCounts,
  recallSummary,
  newBests,
} from '../src/practice/measures.js';
import { applySessionResult, isRusty, daysSincePractice, SPACING } from '../src/practice/spacing.js';
import { generateOpenings } from '../src/practice/openings.js';
import { buildSetlist, finishSession } from '../src/practice/session.js';
import { voicingItem, pairItem, pairItemId, ensureItem, voicingForItem } from '../src/practice/items.js';
import { getVoicingsForSymbol } from '../src/chords/voicings.js';
import { describeMistake, tipForMistake } from '../src/data/mistake-tips.js';

const NOW = new Date('2026-10-12T18:00:00Z');
const DAY_MS = 864e5;
let repNumber = 0;

// Builds a rep for an item, a few seconds apart.
function rep(itemId, kind, fields = {}, sessionId = 'old') {
  repNumber++;
  return { id: `r${repNumber}`, itemId, sessionId, at: new Date(NOW.getTime() - 1e6 + repNumber * 1000).toISOString(), kind, ...fields };
}

// Returns the open shape of a chord as a practice item.
function openItem(symbol) {
  return voicingItem(getVoicingsForSymbol(symbol, { found: false }).find((voicing) => voicing.shape === 'open'), NOW);
}

// ─── Measurements ───

describe('measurements', () => {
  it('works out the clean rate over the last 10 reps', () => {
    const reps = [
      ...Array.from({ length: 5 }, () => rep('x', 'clean-check', { clean: false, mistakes: ['buzz:B'] })),
      ...Array.from({ length: 7 }, () => rep('x', 'clean-check', { clean: true, mistakes: [] })),
    ];
    expect(cleanRate(reps, 'x')).toEqual({ clean: 7, total: 10, rate: 0.7 });
    expect(cleanRate([], 'x').rate).toBeNull();
  });

  it('takes the median form time in seconds', () => {
    const reps = [2400, 1800, 3000, 2100].map((ms) => rep('x', 'form-time', { ms }));
    expect(formTimeSeconds(reps, 'x')).toBe(2.3);
  });

  it('tracks the best and latest one-minute changes', () => {
    const reps = [30, 34, 31].map((count) => rep('p', 'changes', { count }));
    expect(changesSummary(reps, 'p')).toEqual({ best: 34, latest: 31 });
  });

  it('only counts a clean BPM after three clean passes in a row at that tempo', () => {
    const passes = [
      [80, true], [80, true], [80, true],
      [88, true], [88, false], [88, true], [88, true],
      [92, true], [92, true],
    ].map(([bpm, clean]) => rep('g', 'bpm-pass', { bpm, clean, mistakes: [] }));
    expect(cleanBpmBest(passes, 'g')).toBe(80);
  });

  it('counts mistake tags over recent reps, most frequent first', () => {
    const reps = [
      rep('a', 'clean-check', { clean: false, mistakes: ['buzz:B', 'tension'] }),
      rep('a', 'clean-check', { clean: false, mistakes: ['buzz:B'] }),
      rep('a', 'clean-check', { clean: true, mistakes: [] }),
    ];
    expect(mistakeCounts(reps, 'a')).toEqual([{ tag: 'buzz:B', count: 2, of: 3 }, { tag: 'tension', count: 1, of: 3 }]);
  });

  it('summarises recall attempts', () => {
    const reps = [rep('a', 'recall', { success: false }), rep('a', 'recall', { success: true })];
    expect(recallSummary(reps, 'a')).toEqual({ tries: 2, successes: 1, last: true });
  });

  it('describes new personal bests against earlier reps', () => {
    const before = [rep('p', 'changes', { count: 34 })];
    const after = [...before, rep('p', 'changes', { count: 36 })];
    expect(newBests(before, after, 'p', 'C ↔ G')).toEqual(['C ↔ G: 36 changes/min (was 34)']);
    expect(newBests(after, after, 'p', 'C ↔ G')).toEqual([]);
  });
});

// ─── Mistake tips ───

describe('mistake tips', () => {
  it('describes per-string tags and has a tip for each', () => {
    expect(describeMistake('buzz:B')).toBe('B string buzzed');
    expect(describeMistake('late-change')).toBe('Change was late');
    expect(tipForMistake('buzz:G')).toMatch(/behind the fret/);
  });
});

// ─── Spacing ───

describe('spacing', () => {
  const item = { reviewIntervalDays: 2, lastPracticedAt: null };

  it('doubles the interval after a clean session and resets it after mistakes', () => {
    expect(applySessionResult(item, 0.9, NOW).reviewIntervalDays).toBe(4);
    expect(applySessionResult(item, 0.5, NOW).reviewIntervalDays).toBe(SPACING.firstIntervalDays);
    expect(applySessionResult(item, null, NOW).reviewIntervalDays).toBe(2);
    expect(applySessionResult({ reviewIntervalDays: 50 }, 1, NOW).reviewIntervalDays).toBe(SPACING.maxIntervalDays);
  });

  it('marks an item rusty once its interval has passed', () => {
    const practiced = { reviewIntervalDays: 3, lastPracticedAt: new Date(NOW.getTime() - 4 * DAY_MS).toISOString() };
    expect(daysSincePractice(practiced, NOW)).toBe(4);
    expect(isRusty(practiced, NOW)).toBe(true);
    expect(isRusty({ ...practiced, reviewIntervalDays: 7 }, NOW)).toBe(false);
    expect(isRusty({ reviewIntervalDays: 1, lastPracticedAt: null }, NOW)).toBe(false);
  });
});

// ─── Openings ───

describe('openings', () => {
  it('suggests where to start when there is no data', () => {
    const openings = generateOpenings(createEmptyState(NOW), NOW);
    expect(openings.length).toBeGreaterThan(0);
    expect(openings.some((opening) => opening.type === 'new' && opening.text.includes('C open'))).toBe(true);
    expect(openings.some((opening) => opening.itemId === pairItemId('C', 'G'))).toBe(true);
  });

  it('turns a repeated mistake into a Fix opening with its tip, ranked first', () => {
    const state = createEmptyState(NOW);
    const am = ensureItem(state, openItem('Am'));
    for (let index = 0; index < 10; index++) {
      state.reps.push(rep(am.id, 'clean-check', { clean: index >= 4, mistakes: index < 4 ? ['buzz:B'] : [] }));
    }
    const [first] = generateOpenings(state, NOW);
    expect(first.type).toBe('fix');
    expect(first.text).toBe('Am open: B string buzzed 4/10 times. Press just behind the fret, not on top of it, and come down on your fingertip.');
  });

  it('pushes a change pair just past its best', () => {
    const state = createEmptyState(NOW);
    const pair = ensureItem(state, pairItem('C', 'G', NOW));
    state.reps.push(rep(pair.id, 'changes', { count: 34 }));
    const push = generateOpenings(state, NOW).find((opening) => opening.type === 'push' && opening.itemId === pair.id);
    expect(push.text).toBe('C ↔ G: best 34 changes/min. Try 36.');
  });

  it('flags rusty items for review', () => {
    const state = createEmptyState(NOW);
    const f = ensureItem(state, voicingItem(getVoicingsForSymbol('F', { found: false }).find((voicing) => voicing.shape === 'E-form barre'), NOW));
    state.items[f.id] = { ...f, reviewIntervalDays: 2, lastPracticedAt: new Date(NOW.getTime() - 9 * DAY_MS).toISOString() };
    const review = generateOpenings(state, NOW).find((opening) => opening.type === 'review');
    expect(review.text).toBe('F E-form barre, fret 1: 9 days since you last played it.');
  });

  it('never runs out: a fully clean chord still gets Expand, Context, Recall and Ear openings', () => {
    const state = createEmptyState(NOW);
    const c = ensureItem(state, openItem('C'));
    for (let index = 0; index < 10; index++) state.reps.push(rep(c.id, 'clean-check', { clean: true, mistakes: [] }));
    const types = generateOpenings(state, NOW).filter((opening) => opening.itemId === c.id).map((opening) => opening.type);
    expect(types).toEqual(expect.arrayContaining(['expand', 'context', 'recall', 'ear']));
    const expand = generateOpenings(state, NOW).find((opening) => opening.type === 'expand');
    expect(expand.text).toBe('C is clean in open position. Learn the A-form barre at fret 3.');
    expect(voicingForItem(expand.create).frets).toEqual([null, 3, 5, 5, 5, 3]);
  });

  it('changes when the data changes', () => {
    const state = createEmptyState(NOW);
    const before = generateOpenings(state, NOW).map((opening) => opening.text);
    const pair = ensureItem(state, pairItem('C', 'G', NOW));
    state.reps.push(rep(pair.id, 'changes', { count: 20 }));
    const after = generateOpenings(state, NOW).map((opening) => opening.text);
    expect(after).not.toEqual(before);
    expect(after).toContain('C ↔ G: best 20 changes/min. Try 22.');
  });
});

// ─── Sessions ───

describe('sessions', () => {
  it('proposes a full setlist even with no data', () => {
    const state = createEmptyState(NOW);
    const blocks = buildSetlist(state, NOW);
    expect(blocks.map((block) => block.kind)).toEqual(['warmup', 'fix', 'push', 'review', 'ear', 'free']);
    expect(blocks.filter((block) => block.itemId).every((block) => state.items[block.itemId])).toBe(true);
    expect(new Set(blocks.filter((block) => block.itemId).map((block) => block.itemId)).size).toBe(4);
  });

  it('runs a full session: setlist → measured reps → receipt, and the openings move on', () => {
    const state = createEmptyState(NOW);
    const start = new Date(NOW.getTime() - 25 * 60000);
    const session = { id: 's1', start: start.toISOString(), blocks: buildSetlist(state, start) };
    const fixBlock = session.blocks.find((block) => block.kind === 'fix');
    const pushBlock = session.blocks.find((block) => block.kind === 'push');
    const openingsBefore = generateOpenings(state, NOW).map((opening) => opening.text);

    for (let index = 0; index < 10; index++) {
      state.reps.push(rep(fixBlock.itemId, 'clean-check', { clean: index > 2, mistakes: index <= 2 ? ['buzz:G'] : [] }, 's1'));
    }
    state.reps.push(rep(pushBlock.itemId, 'changes', { count: 28 }, 's1'));

    const stub = finishSession(state, session, NOW);
    expect(stub.minutes).toBe(25);
    expect(stub.bests).toContain('C ↔ G: 28 changes/min');
    expect(stub.mistake).toMatch(/^G string buzzed in .+ \(3×\)$/);
    expect(stub.nextOpening).toBeTruthy();
    expect(state.sessions).toHaveLength(1);
    expect(state.items[fixBlock.itemId].lastPracticedAt).toBe(NOW.toISOString());
    expect(state.items[fixBlock.itemId].reviewIntervalDays).toBe(1);

    const openingsAfter = generateOpenings(state, NOW).map((opening) => opening.text);
    expect(openingsAfter).not.toEqual(openingsBefore);
    expect(openingsAfter.some((text) => text.includes('G string buzzed 3/10'))).toBe(true);
  });
});

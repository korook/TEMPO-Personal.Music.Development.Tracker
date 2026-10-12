// The openings generator (TEMPO_PLAN.md 6.5): a ranked list of specific next steps, built
// from the practice data. There is never a "done" state: even a fully clean item still gets
// Expand, Context, Recall or Ear openings.
//
// An opening: { type, itemId, text, priority, create? }
//   type: 'fix' | 'push' | 'review' | 'expand' | 'context' | 'recall' | 'ear' | 'new'
//   create: an item to add when the opening is about something not practiced yet.

import { cleanRate, mistakeCounts, changesSummary, cleanBpmBest, recallSummary } from './measures.js';
import { isRusty, daysSincePractice } from './spacing.js';
import { voicingForItem, voicingItem, progressionItem, progressionItemId, pairItem } from './items.js';
import { describeMistake, tipForMistake } from '../data/mistake-tips.js';
import { TRANSITION_DRILLS } from '../data/progressions.js';
import { getVoicingsForSymbol } from '../chords/voicings.js';
import { parseChordSymbol, chordSymbol } from '../theory/chords.js';

const FIX_MIN_COUNT = 3;
const PUSH_STEP_CHANGES = 2;
const PUSH_STEP_BPM = 4;
const CLEAN_FOR_EXPAND = 0.9;
const MIN_REPS_FOR_EXPAND = 5;

// The first chords and change to learn when there is no data yet.
const STARTER_CHORDS = ['C', 'G', 'Am', 'E', 'D'];
const STARTER_PAIR = ['C', 'G'];

// Chord types that are easy to mix up by ear, for Ear openings.
const EAR_PARTNERS = {
  major: 'minor', minor: 'major', dominant7: 'major7', major7: 'dominant7',
  minor7: 'half-diminished', 'half-diminished': 'minor7', sus2: 'sus4', sus4: 'sus2',
  major6: 'major7', minor6: 'minor7', add9: 'major', diminished: 'minor', augmented: 'major', power: 'major',
};

// ─── Generating ───

// Returns every opening for the current data, highest priority first.
export function generateOpenings(state, now = new Date()) {
  const items = Object.values(state.items);
  const openings = [];
  for (const item of items) {
    openings.push(...fixOpenings(state, item));
    openings.push(...pushOpenings(state, item));
    openings.push(...reviewOpenings(item, now));
    if (item.type === 'voicing') openings.push(...voicingGrowthOpenings(state, item));
  }
  if (items.length === 0 || !items.some((item) => item.type === 'voicing')) openings.push(...starterOpenings(state));
  if (!items.some((item) => item.type === 'pair')) openings.push(starterPairOpening());
  return dedupe(openings).sort((a, b) => b.priority - a.priority);
}

// Fix: a mistake that keeps coming back, e.g. "Am: B string buzzed 4/10 times. Arch ...".
function fixOpenings(state, item) {
  const [top] = mistakeCounts(state.reps, item.id);
  if (!top || top.count < FIX_MIN_COUNT) return [];
  return [{
    type: 'fix',
    itemId: item.id,
    text: `${item.label}: ${describeMistake(top.tag)} ${top.count}/${top.of} times. ${tipForMistake(top.tag)}`,
    short: `${item.label}: ${describeMistake(top.tag)} ${top.count}/${top.of}`,
    priority: 100 + top.count * 5,
  }];
}

// Push: a personal best within reach, e.g. "C ↔ G: best 34 changes/min. Try 36."
function pushOpenings(state, item) {
  if (item.type === 'pair') {
    const { best } = changesSummary(state.reps, item.id);
    if (best === null) {
      return [{ type: 'push', itemId: item.id, text: `${item.label}: do a one-minute changes test to set your first best.`, short: `${item.label}: first one-minute test`, priority: 75 }];
    }
    return [{ type: 'push', itemId: item.id, text: `${item.label}: best ${best} changes/min. Try ${best + PUSH_STEP_CHANGES}.`, short: `${item.label}: ${PUSH_STEP_CHANGES} changes from your best`, priority: 80 }];
  }
  if (item.type === 'progression' || item.type === 'exercise') {
    const best = cleanBpmBest(state.reps, item.id);
    if (best === null) return [];
    return [{ type: 'push', itemId: item.id, text: `${item.label}: clean at ${best} BPM. Try ${best + PUSH_STEP_BPM}.`, short: `${item.label}: try ${best + PUSH_STEP_BPM} BPM`, priority: 78 }];
  }
  return [];
}

// Review: the item's review interval has passed.
function reviewOpenings(item, now) {
  if (!isRusty(item, now)) return [];
  const days = daysSincePractice(item, now);
  return [{
    type: 'review',
    itemId: item.id,
    text: `${item.label}: ${days} day${days === 1 ? '' : 's'} since you last played it.`,
    short: `${item.label} rusty, ${days} day${days === 1 ? '' : 's'}`,
    priority: 70 + Math.min(days, 30),
  }];
}

// For a chord shape that is going well: learn the next shape up the neck (Expand), use it
// in a progression (Context), play it from memory (Recall), and hear it (Ear).
function voicingGrowthOpenings(state, item) {
  const openings = [];
  const rate = cleanRate(state.reps, item.id);
  const isClean = rate.total >= MIN_REPS_FOR_EXPAND && rate.rate >= CLEAN_FOR_EXPAND;
  const name = item.chord;

  if (isClean) {
    const next = nextShapeUpTheNeck(state, item);
    if (next) {
      const where = item.label.endsWith('open') ? 'in open position' : `at fret ${voicingForItem(item)?.position ?? ''}`;
      openings.push({
        type: 'expand',
        itemId: item.id,
        text: `${name} is clean ${where}. Learn the ${next.shape} at fret ${next.position}.`,
        short: `${name}: next shape, fret ${next.position}`,
        priority: 40,
        create: voicingItem(next),
      });
    }
    const progression = TRANSITION_DRILLS.map((drill) => drill.chords.split('→').map((chord) => chord.trim())).find((chords) => chords.includes(name));
    if (progression && !state.items[progressionItemId(progression)]) {
      openings.push({
        type: 'context',
        itemId: item.id,
        text: `Use ${name} in the ${progression.join('–')} progression at 70 BPM.`,
        short: `${name} in ${progression.join('–')}`,
        priority: 35,
        create: progressionItem(progression),
      });
    }
  }

  const recall = recallSummary(state.reps, item.id);
  if (rate.total > 0 && recall.successes === 0) {
    openings.push({ type: 'recall', itemId: item.id, text: `Try ${item.label} from memory: hide the diagram, form it, then check.`, short: `${name} from memory`, priority: 30 });
  }

  if (isClean) {
    const { root, quality } = parseChordSymbol(name);
    const partner = chordSymbol(root, EAR_PARTNERS[quality] || 'major');
    openings.push({ type: 'ear', itemId: item.id, text: `Can you hear ${name} vs ${partner} by sound alone?`, short: `${name} vs ${partner} by ear`, priority: 20 });
  }
  return openings;
}

// Returns the next standard shape of the same chord further up the neck that isn't an item yet.
function nextShapeUpTheNeck(state, item) {
  const current = voicingForItem(item);
  if (!current) return null;
  return getVoicingsForSymbol(item.chord, { found: false })
    .filter((voicing) => voicing.source === 'standard' && !voicing.shape.startsWith('triad'))
    .find((voicing) => voicing.position > current.position && !state.items[`voicing:${voicing.id}`]) || null;
}

// With no chord shapes yet: start with the classic open chords.
function starterOpenings(state) {
  return STARTER_CHORDS
    .map((chord, index) => {
      const voicing = getVoicingsForSymbol(chord, { found: false }).find((candidate) => candidate.shape === 'open');
      const item = voicingItem(voicing);
      if (state.items[item.id]) return null;
      return { type: 'new', itemId: item.id, text: `Start with ${item.label}: get it ringing clean.`, short: `Learn ${item.label}`, priority: 55 - index, create: item };
    })
    .filter(Boolean);
}

// With no chord changes yet: start with C ↔ G.
function starterPairOpening() {
  const item = pairItem(...STARTER_PAIR);
  return { type: 'push', itemId: item.id, text: `${item.label}: do a one-minute changes test to set your first best.`, short: `${item.label}: first one-minute test`, priority: 60, create: item };
}

// Keeps one opening per type and item.
function dedupe(openings) {
  const seen = new Set();
  return openings.filter((opening) => {
    const key = `${opening.type}|${opening.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Practice sessions (TEMPO_PLAN.md 6.8): the setlist builder, and finishing a session —
// updating review intervals, finding new personal bests and printing the receipt.

import { generateOpenings } from './openings.js';
import { cleanRate, newBests, mistakeCounts } from './measures.js';
import { applySessionResult } from './spacing.js';
import { exerciseItem, ensureItem } from './items.js';
import { FINGER_EXERCISES } from '../data/exercises.js';
import { describeMistake } from '../data/mistake-tips.js';
import { makeId } from '../state/storage.js';
import { checkMilestones } from './milestones.js';

// ─── Measuring tools ───

// Which tool a block uses, from the item type.
export function measureFor(itemType) {
  return { voicing: 'clean-check', pair: 'changes', progression: 'bpm-pass', exercise: 'bpm-pass' }[itemType] || 'none';
}

// ─── Setlist ───

// Proposes a session: warm-up, fix, push, review, ear and free play (TEMPO_PLAN.md 6.8).
// Each block picks the top opening of its type; missing ones fall back to the next best
// opening, so the setlist is always full. Items for new openings are added to the state.
export function buildSetlist(state, now = new Date()) {
  const openings = generateOpenings(state, now);
  const used = new Set();

  // Takes the first opening of the given types whose item isn't in the setlist yet.
  const take = (types) => {
    const opening = openings.find((candidate) => types.includes(candidate.type) && !used.has(candidate.create ? candidate.create.id : candidate.itemId));
    if (!opening) return null;
    const item = opening.create ? ensureItem(state, opening.create) : state.items[opening.itemId];
    used.add(item.id);
    return { opening, item };
  };

  const blocks = [warmUpBlock(state, now)];
  used.add(blocks[0].itemId);
  const fix = take(['fix']) || take(['new', 'expand', 'review', 'recall']);
  if (fix) blocks.push(practiceBlock('fix', fix, 5));
  const push = take(['push']) || take(['context', 'expand', 'new']);
  if (push) blocks.push(practiceBlock('push', push, 3));
  const review = take(['review']) || take(['recall', 'new', 'context', 'expand']);
  if (review) blocks.push(practiceBlock('review', review, 5));
  blocks.push({ id: makeId(), kind: 'ear', title: 'Ear', note: 'Two minutes of listening', minutes: 2, measure: 'none', itemId: null });
  blocks.push({ id: makeId(), kind: 'free', title: 'Free play', note: 'No timer. Play what you like.', minutes: null, measure: 'none', itemId: null });
  return blocks;
}

// The warm-up: one finger exercise, a different one each day.
function warmUpBlock(state, now) {
  const exercise = FINGER_EXERCISES[Math.floor(now.getTime() / 864e5) % FINGER_EXERCISES.length];
  const item = ensureItem(state, exerciseItem(exercise.name, now));
  return { id: makeId(), kind: 'warmup', title: exercise.name, note: exercise.description, minutes: 3, measure: 'bpm-pass', itemId: item.id };
}

// What each opening type is called on a block's label strip.
const OPENING_LABELS = { fix: 'Fix', push: 'Push', review: 'Review', new: 'Learn', expand: 'Next shape', context: 'In context', recall: 'From memory', ear: 'Ear' };

// A block built from an opening. `kind` is its slot in the setlist; `label` says what it really
// is (a beginner's "fix" slot holds a "Learn" block, for example).
function practiceBlock(kind, { opening, item }, minutes) {
  return { id: makeId(), kind, label: OPENING_LABELS[opening.type], title: item.label, note: opening.text, minutes, measure: measureFor(item.type), itemId: item.id };
}

// Labels for each block kind, as shown on the label-maker strips.
export const BLOCK_LABELS = { warmup: 'Warm-up', fix: 'Fix', push: 'Push', review: 'Review', ear: 'Ear', free: 'Free play' };

// Returns the label to show for a block.
export function blockLabel(block) {
  return block.label || BLOCK_LABELS[block.kind];
}

// ─── Finishing ───

// Ends a session: saves it with its receipt, updates review intervals and returns the receipt.
// `session` = { id, start, blocks }; reps logged during it carry its id.
export function finishSession(state, session, now = new Date()) {
  const sessionReps = state.reps.filter((rep) => rep.sessionId === session.id);
  const repsBefore = state.reps.filter((rep) => rep.sessionId !== session.id);
  const practicedIds = [...new Set(session.blocks.map((block) => block.itemId).filter(Boolean))];

  const bests = [];
  for (const itemId of practicedIds) {
    const item = state.items[itemId];
    if (!item) continue;
    const itemReps = sessionReps.filter((rep) => rep.itemId === itemId);
    if (itemReps.length === 0) continue;
    const rate = cleanRate(itemReps, itemId).rate;
    state.items[itemId] = applySessionResult(item, rate, now);
    bests.push(...newBests(repsBefore, state.reps, itemId, item.label));
  }

  const minutes = Math.max(1, Math.round((now.getTime() - new Date(session.start).getTime()) / 60000));
  const [next] = generateOpenings(state, now);
  const stub = {
    milestones: [],
    number: state.sessions.length + 1,
    date: now.toISOString(),
    minutes,
    title: `Setlist: ${session.blocks.length} blocks`,
    bests,
    mistake: topMistakeOfSession(state, sessionReps),
    nextOpening: next ? next.short : null,
  };

  state.sessions.push({
    id: session.id,
    start: session.start,
    end: now.toISOString(),
    minutes,
    blocks: session.blocks.map(({ kind, label, title, itemId, minutes: planned }) => ({ kind, label: label || BLOCK_LABELS[kind], title, itemId, minutes: planned })),
    stub,
  });
  stub.milestones = checkMilestones(state, now).map((milestone) => milestone.title);
  return stub;
}

// The mistake logged most often this session, e.g. "B string buzzed in Am open (3×)".
function topMistakeOfSession(state, sessionReps) {
  let top = null;
  for (const itemId of new Set(sessionReps.map((rep) => rep.itemId))) {
    const [first] = mistakeCounts(sessionReps, itemId, Infinity);
    if (first && (!top || first.count > top.count)) top = { ...first, itemId };
  }
  if (!top) return null;
  const label = state.items[top.itemId] ? state.items[top.itemId].label : '';
  return `${describeMistake(top.tag)} in ${label} (${top.count}×)`;
}

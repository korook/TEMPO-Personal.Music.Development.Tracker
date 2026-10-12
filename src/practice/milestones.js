// Milestones (TEMPO_PLAN.md 6.9): achievements reached by things that happened, never a
// level cap. Each milestone has a check over the practice data; reached ones are stored in
// state.milestones as { id, at } so their date never changes.

import { cleanRate, changesSummary } from './measures.js';
import { countStreak, totalMinutes } from './history.js';

const CLEAN = 0.8;
const MIN_REPS = 5;

// ─── Milestone list ───

// Each milestone: id, title (the polaroid caption), what it takes, and its check.
export const MILESTONES = [
  { id: 'first-session', title: 'First session', needs: 'Finish a practice session', check: (state) => state.sessions.some((session) => session.stub) },
  { id: 'first-clean-shape', title: 'First clean chord', needs: 'Any chord shape clean 8 out of 10 times', check: (state) => cleanShapes(state).length >= 1 },
  { id: 'first-clean-barre', title: 'First clean barre', needs: 'A barre shape clean 8 out of 10 times', check: (state) => cleanShapes(state).some((item) => /barre/.test(item.label)) },
  { id: 'five-clean-shapes', title: 'Five clean shapes', needs: 'Five chord shapes clean 8 out of 10 times', check: (state) => cleanShapes(state).length >= 5 },
  { id: 'changes-30', title: '30 changes a minute', needs: '30 clean changes in a one-minute test', check: (state) => bestChanges(state) >= 30 },
  { id: 'changes-60', title: '60 changes a minute', needs: '60 clean changes in a one-minute test', check: (state) => bestChanges(state) >= 60 },
  { id: 'all-caged', title: 'One chord, all five CAGED shapes', needs: 'Practise a chord in its C, A, G, E and D forms', check: (state) => hasAllCagedShapes(state) },
  { id: 'streak-7', title: 'Seven-day streak', needs: 'Play on seven days in a row (rest days allowed)', check: (state) => countStreak(state.sessions, new Date(), state.settings.restDaysPerWeek).days >= 7 },
  { id: 'ten-hours', title: 'Ten hours played', needs: 'Ten hours of logged practice', check: (state) => totalMinutes(state.sessions) >= 600 },
];

// ─── Checking ───

// Adds every newly reached milestone to state.milestones and returns them.
export function checkMilestones(state, now = new Date()) {
  const reached = new Set(state.milestones.map((milestone) => milestone.id));
  const fresh = MILESTONES.filter((milestone) => !reached.has(milestone.id) && milestone.check(state));
  for (const milestone of fresh) state.milestones.push({ id: milestone.id, at: now.toISOString() });
  return fresh;
}

// Returns every milestone with its date if reached: [{ ...milestone, at }].
export function milestoneBoard(state) {
  return MILESTONES.map((milestone) => {
    const record = state.milestones.find((entry) => entry.id === milestone.id);
    return { ...milestone, at: record ? record.at : null };
  });
}

// ─── Helpers ───

// The chord-shape items that are clean (8/10 or better over at least 5 reps).
function cleanShapes(state) {
  return Object.values(state.items).filter((item) => {
    if (item.type !== 'voicing') return false;
    const rate = cleanRate(state.reps, item.id);
    return rate.total >= MIN_REPS && rate.rate >= CLEAN;
  });
}

// The best one-minute changes count across all change pairs.
function bestChanges(state) {
  return Math.max(0, ...Object.values(state.items)
    .filter((item) => item.type === 'pair')
    .map((item) => changesSummary(state.reps, item.id).best || 0));
}

// True if one chord has been practised in all five CAGED forms.
function hasAllCagedShapes(state) {
  const formsByChord = new Map();
  for (const item of Object.values(state.items)) {
    if (item.type !== 'voicing' || !state.reps.some((rep) => rep.itemId === item.id)) continue;
    const form = (/\b([CAGED])-form/.exec(item.label) || [])[1] || (/ open$/.test(item.label) ? openForm(item.chord) : null);
    if (!form) continue;
    if (!formsByChord.has(item.chord)) formsByChord.set(item.chord, new Set());
    formsByChord.get(item.chord).add(form);
  }
  return [...formsByChord.values()].some((forms) => forms.size === 5);
}

// The open C, A, G, E and D shapes (and their minor and 7th versions) are the CAGED forms themselves.
function openForm(chord) {
  return /^[CAGED](m|7|maj7|m7)?$/.test(chord) ? chord[0] : null;
}

// Measurements from raw reps (TEMPO_PLAN.md 6.3): clean rate, form time, recall, changes
// per minute and clean BPM, plus mistake counts and personal bests. Everything is worked out
// from state.reps, so a microphone can fill in reps later without changing this file.
//
// A rep: { id, itemId, sessionId, at, kind, ...measurement }
//   'clean-check'  { clean: bool, mistakes: [tags] }
//   'form-time'    { ms }
//   'recall'       { success: bool }
//   'changes'      { count }               (clean changes in one minute)
//   'bpm-pass'     { bpm, clean: bool, mistakes }

const RECENT = 10;
const CLEAN_PASSES_FOR_BEST = 3;

// ─── Picking reps ───

// Returns the item's reps of one kind (or all kinds), oldest first.
export function repsFor(reps, itemId, kind = null) {
  return reps.filter((rep) => rep.itemId === itemId && (kind === null || rep.kind === kind));
}

// Returns the last `count` reps of one kind for an item.
export function recentReps(reps, itemId, kind, count = RECENT) {
  return repsFor(reps, itemId, kind).slice(-count);
}

// ─── Measurements ───

// Clean rate over the last 10 clean-checks (and BPM passes): { clean, total, rate } (rate null if none).
export function cleanRate(reps, itemId, count = RECENT) {
  const checks = reps.filter((rep) => rep.itemId === itemId && (rep.kind === 'clean-check' || rep.kind === 'bpm-pass')).slice(-count);
  const clean = checks.filter((rep) => rep.clean).length;
  return { clean, total: checks.length, rate: checks.length ? clean / checks.length : null };
}

// Median form time in seconds over the recent form-time reps (null if none).
export function formTimeSeconds(reps, itemId, count = RECENT) {
  const times = recentReps(reps, itemId, 'form-time', count).map((rep) => rep.ms).sort((a, b) => a - b);
  if (times.length === 0) return null;
  const middle = Math.floor(times.length / 2);
  const median = times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2;
  return Math.round(median / 100) / 10;
}

// Recall so far: { tries, successes, last } (last is true/false/null).
export function recallSummary(reps, itemId) {
  const tries = repsFor(reps, itemId, 'recall');
  return {
    tries: tries.length,
    successes: tries.filter((rep) => rep.success).length,
    last: tries.length ? tries[tries.length - 1].success : null,
  };
}

// Best and latest one-minute change counts: { best, latest } (null if none).
export function changesSummary(reps, itemId) {
  const counts = repsFor(reps, itemId, 'changes').map((rep) => rep.count);
  return {
    best: counts.length ? Math.max(...counts) : null,
    latest: counts.length ? counts[counts.length - 1] : null,
  };
}

// Highest tempo played clean three passes in a row (null if none yet).
export function cleanBpmBest(reps, itemId) {
  let best = null;
  let streakBpm = null;
  let streak = 0;
  for (const rep of repsFor(reps, itemId, 'bpm-pass')) {
    if (rep.clean && rep.bpm === streakBpm) {
      streak++;
    } else if (rep.clean) {
      streakBpm = rep.bpm;
      streak = 1;
    } else {
      streakBpm = null;
      streak = 0;
    }
    if (streak >= CLEAN_PASSES_FOR_BEST && (best === null || streakBpm > best)) best = streakBpm;
  }
  return best;
}

// ─── Mistakes ───

// Counts each mistake tag over the item's last 10 reps: [{ tag, count, of }] most frequent first.
export function mistakeCounts(reps, itemId, count = RECENT) {
  const recent = reps.filter((rep) => rep.itemId === itemId && Array.isArray(rep.mistakes)).slice(-count);
  const counts = new Map();
  for (const rep of recent) {
    for (const tag of new Set(rep.mistakes)) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, times]) => ({ tag, count: times, of: recent.length }))
    .sort((a, b) => b.count - a.count);
}

// ─── Personal bests ───

// Returns every personal best an item has: { changesPerMin, cleanBpm, formSeconds } (missing ones null).
export function bestsFor(reps, itemId) {
  const formTimes = repsFor(reps, itemId, 'form-time').map((rep) => rep.ms);
  return {
    changesPerMin: changesSummary(reps, itemId).best,
    cleanBpm: cleanBpmBest(reps, itemId),
    formSeconds: formTimes.length ? Math.round(Math.min(...formTimes) / 100) / 10 : null,
  };
}

// Compares bests before and after a session's reps and describes what improved on an
// earlier best, e.g. ["C ↔ G: 36 changes/min (was 34)"]. A first result is not a "new best"
// (see firstResults).
export function newBests(repsBefore, repsAfter, itemId, label) {
  const before = bestsFor(repsBefore, itemId);
  const after = bestsFor(repsAfter, itemId);
  const lines = [];
  if (before.changesPerMin !== null && after.changesPerMin > before.changesPerMin) {
    lines.push(`${label}: ${after.changesPerMin} changes/min (was ${before.changesPerMin})`);
  }
  if (before.cleanBpm !== null && after.cleanBpm > before.cleanBpm) {
    lines.push(`${label}: clean at ${after.cleanBpm} BPM (was ${before.cleanBpm})`);
  }
  if (before.formSeconds !== null && after.formSeconds < before.formSeconds) {
    lines.push(`${label}: formed in ${after.formSeconds}s (was ${before.formSeconds}s)`);
  }
  return lines;
}

// Describes measurements made for the first time this session, e.g.
// ["String skipping: first clean pass at 80 BPM"]. They start the record that bests beat later.
export function firstResults(repsBefore, repsAfter, itemId, label) {
  const before = bestsFor(repsBefore, itemId);
  const after = bestsFor(repsAfter, itemId);
  const lines = [];
  if (before.changesPerMin === null && after.changesPerMin !== null) lines.push(`${label}: first one-minute test, ${after.changesPerMin} changes`);
  if (before.cleanBpm === null && after.cleanBpm !== null) lines.push(`${label}: first clean pass at ${after.cleanBpm} BPM`);
  if (before.formSeconds === null && after.formSeconds !== null) lines.push(`${label}: first timed form, ${after.formSeconds}s`);
  return lines;
}

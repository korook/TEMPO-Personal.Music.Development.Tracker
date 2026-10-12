// Review intervals: a simple Leitner-style spacing (TEMPO_PLAN.md 6.6). A clean session
// makes an item's interval longer; a session with mistakes sends it back to one day.
// When the interval passes, the item is "rusty" and gets a Review opening.
// All the numbers live in SPACING so they can be tuned in one place.

const DAY_MS = 864e5;

// ─── Settings ───

export const SPACING = {
  firstIntervalDays: 1,     // a new item comes back the next day
  cleanMultiplier: 2,       // a clean session doubles the interval
  maxIntervalDays: 60,      // but never more than two months
  cleanRateNeeded: 0.8,     // "clean" = at least 8 of 10 reps clean
};

// ─── Updating ───

// Returns the item's new interval after a session with `cleanRate` (0–1, or null if nothing
// was measured), and stamps the practice date.
export function applySessionResult(item, cleanRate, now = new Date()) {
  const current = item.reviewIntervalDays || SPACING.firstIntervalDays;
  let next = current;
  if (cleanRate !== null && cleanRate >= SPACING.cleanRateNeeded) {
    next = Math.min(SPACING.maxIntervalDays, current * SPACING.cleanMultiplier);
  } else if (cleanRate !== null) {
    next = SPACING.firstIntervalDays;
  }
  return { ...item, reviewIntervalDays: next, lastPracticedAt: now.toISOString() };
}

// ─── Reading ───

// Returns whole days since the item was last practiced (Infinity if never).
export function daysSincePractice(item, now = new Date()) {
  if (!item.lastPracticedAt) return Infinity;
  return Math.floor((now.getTime() - new Date(item.lastPracticedAt).getTime()) / DAY_MS);
}

// True when the review interval has passed since the last practice.
export function isRusty(item, now = new Date()) {
  if (!item.lastPracticedAt) return false;
  return daysSincePractice(item, now) >= (item.reviewIntervalDays || SPACING.firstIntervalDays);
}

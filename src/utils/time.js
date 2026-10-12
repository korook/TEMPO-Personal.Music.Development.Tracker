// Small helpers for formatting times and dates for display.

// ─── Formatting ───

// Turns a number of seconds into "MM:SS", e.g. 75 → "01:15".
export function formatClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Returns a copy of `date` moved back by `days` calendar days.
export function daysBefore(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

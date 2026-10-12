// Summaries of logged practice sessions: totals, streak and minutes per day.
// Sessions are v2 records ({ start, end, minutes, ... }); a session counts on the day it ended.
// Behaviour is the same as v1, including the streak bug that Phase 4 fixes
// (the streak shows 0 if you practiced yesterday but not yet today).

const DAY_MS = 864e5;

// ─── Totals ───

// Adds up the minutes of every session in the list.
export function totalMinutes(sessions) {
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

// Adds up the minutes logged in the 7 × 24 hours before `now`.
export function weeklyMinutes(sessions, now = Date.now()) {
  const recent = sessions.filter((session) => now - new Date(session.end).getTime() < 7 * DAY_MS);
  return totalMinutes(recent);
}

// Adds up the minutes logged on the same calendar day as `day`.
export function minutesOnDay(sessions, day) {
  const sameDay = sessions.filter((session) => new Date(session.end).toDateString() === day.toDateString());
  return totalMinutes(sameDay);
}

// ─── Streak ───

// Counts consecutive days with a session, starting from today and going back.
export function countStreak(sessions, today = new Date()) {
  let streak = 0;
  for (let daysBack = 0; daysBack < 365; daysBack++) {
    const day = new Date(today);
    day.setDate(day.getDate() - daysBack);
    const practiced = sessions.some((session) => new Date(session.end).toDateString() === day.toDateString());
    if (!practiced) break;
    streak++;
  }
  return streak;
}

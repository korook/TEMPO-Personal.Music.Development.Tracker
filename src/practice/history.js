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

// Counts the practice streak (TEMPO_PLAN.md 6.10). If today has no session yet the streak
// counts from yesterday, so it doesn't show 0 before you've had a chance to play, and up to
// `restDaysPerWeek` missed days in each week don't break it.
// Returns { days, practicedToday }: days = practiced days in the streak.
export function countStreak(sessions, today = new Date(), restDaysPerWeek = 1) {
  const practicedOn = (daysBack) => {
    const day = new Date(today);
    day.setDate(day.getDate() - daysBack);
    return sessions.some((session) => new Date(session.end).toDateString() === day.toDateString());
  };

  const practicedToday = practicedOn(0);
  let days = 0;
  let restLeft = restDaysPerWeek;
  for (let daysBack = practicedToday ? 0 : 1; daysBack < 366; daysBack++) {
    if ((daysBack % 7) === 0) restLeft = restDaysPerWeek;
    if (practicedOn(daysBack)) {
      days++;
    } else if (days > 0 && restLeft > 0 && practicedOn(daysBack + 1)) {
      restLeft--;
    } else {
      break;
    }
  }
  return { days, practicedToday };
}

// ─── Day labels ───

// Short names for the last `count` days ending today, e.g. [..., 'Sat', 'Sun', 'Today'].
export function lastDayLabels(count = 7, today = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const daysBack = count - 1 - index;
    if (daysBack === 0) return 'Today';
    const day = new Date(today);
    day.setDate(day.getDate() - daysBack);
    return day.toLocaleDateString('en', { weekday: 'short' });
  });
}

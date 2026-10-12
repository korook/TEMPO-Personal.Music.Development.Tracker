// Tests for the session summaries and time formatting moved over from v1.
// Sessions use the v2 shape ({ end, minutes }).

import { describe, it, expect } from 'vitest';
import { totalMinutes, weeklyMinutes, minutesOnDay, countStreak, lastDayLabels } from '../src/practice/history.js';
import { formatClock, daysBefore } from '../src/utils/time.js';

const NOW = new Date('2026-10-12T18:00:00');

// Builds a session logged `days` days before NOW, lasting `mins` minutes.
function sessionDaysAgo(days, mins) {
  return { end: daysBefore(NOW, days).toISOString(), minutes: mins };
}

// ─── Time formatting ───

describe('formatClock', () => {
  it('pads minutes and seconds to two digits', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(75)).toBe('01:15');
    expect(formatClock(3600)).toBe('60:00');
  });
});

// ─── Totals ───

describe('session totals', () => {
  const sessions = [sessionDaysAgo(0, 20), sessionDaysAgo(0, 10), sessionDaysAgo(3, 15), sessionDaysAgo(10, 40)];

  it('adds up all minutes', () => {
    expect(totalMinutes(sessions)).toBe(85);
  });

  it('counts only the last 7 days for the weekly total', () => {
    expect(weeklyMinutes(sessions, NOW.getTime())).toBe(45);
  });

  it('adds up minutes on one calendar day', () => {
    expect(minutesOnDay(sessions, NOW)).toBe(30);
    expect(minutesOnDay(sessions, daysBefore(NOW, 1))).toBe(0);
  });
});

// ─── Streak ───

describe('countStreak', () => {
  it('counts consecutive days ending today', () => {
    const sessions = [sessionDaysAgo(0, 10), sessionDaysAgo(1, 10), sessionDaysAgo(2, 10), sessionDaysAgo(5, 10)];
    expect(countStreak(sessions, NOW, 0)).toEqual({ days: 3, practicedToday: true });
  });

  it('counts from yesterday when today has no session yet', () => {
    const sessions = [sessionDaysAgo(1, 10), sessionDaysAgo(2, 10)];
    expect(countStreak(sessions, NOW)).toEqual({ days: 2, practicedToday: false });
  });

  it('lets one rest day a week pass without breaking the streak', () => {
    const sessions = [sessionDaysAgo(0, 10), sessionDaysAgo(2, 10), sessionDaysAgo(3, 10)];
    expect(countStreak(sessions, NOW, 1).days).toBe(3);
    expect(countStreak(sessions, NOW, 0).days).toBe(1);
  });

  it('stops at two missed days in a row', () => {
    const sessions = [sessionDaysAgo(0, 10), sessionDaysAgo(3, 10)];
    expect(countStreak(sessions, NOW, 1).days).toBe(1);
  });

  it('is 0 with no sessions', () => {
    expect(countStreak([], NOW).days).toBe(0);
  });
});

describe('lastDayLabels', () => {
  it('names the real days, ending with Today', () => {
    expect(lastDayLabels(3, new Date('2026-10-12T18:00:00'))).toEqual(['Sat', 'Sun', 'Today']);
  });
});

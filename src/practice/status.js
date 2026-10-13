// Status labels for a practice item (TEMPO_PLAN.md 6.7): New → Learning → Steady → Fluent →
// In the fingers. They come from the evidence (clean rate, recall, spacing interval) and are
// never a ceiling: every label says what the next one needs, and "In the fingers" items
// still get openings.

import { cleanRate, recallSummary } from './measures.js';

// ─── Thresholds ───

// All the numbers in one place so they can be tuned.
export const STATUS_RULES = {
  newBelowReps: 3,          // fewer measured reps than this = New
  steadyRate: 0.6,          // clean rate for Steady
  fluentRate: 0.8,          // clean rate for Fluent (also needs one recall from memory)
  fingersRate: 0.9,         // clean rate for In the fingers…
  fingersIntervalDays: 8,   // …plus a review interval this long (it stayed clean across sessions)
};

export const STATUS_ORDER = ['New', 'Learning', 'Steady', 'Fluent', 'In the fingers'];

// ─── Working it out ───

// Returns { label, next } for an item, e.g. { label: 'Steady', next: '8 of 10 clean and one recall from memory for Fluent' }.
export function itemStatus(item, reps) {
  const rule = STATUS_RULES;
  const { total, rate } = cleanRate(reps, item.id);
  const recall = recallSummary(reps, item.id);
  const recalled = recall.successes > 0;
  const percent = (value) => `${Math.round(value * 10)} of 10 clean`;

  if (total < rule.newBelowReps) {
    return { label: 'New', next: `${rule.newBelowReps - total} more measured rep${rule.newBelowReps - total === 1 ? '' : 's'} to get a clean rate` };
  }
  if (rate < rule.steadyRate) return { label: 'Learning', next: `${percent(rule.steadyRate)} for Steady` };
  if (rate < rule.fluentRate || !recalled) {
    const needs = [rate < rule.fluentRate ? percent(rule.fluentRate) : null, recalled ? null : 'one recall from memory'].filter(Boolean);
    return { label: 'Steady', next: `${needs.join(' and ')} for Fluent` };
  }
  if (rate < rule.fingersRate || (item.reviewIntervalDays || 1) < rule.fingersIntervalDays) {
    return { label: 'Fluent', next: `${percent(rule.fingersRate)}, kept up across sessions, for In the fingers` };
  }
  return { label: 'In the fingers', next: 'Keep it fresh: there are still openings to try' };
}

// Tests for the status labels (TEMPO_PLAN.md 6.7): they follow the evidence, and every
// label says what the next one needs.

import { describe, it, expect } from 'vitest';
import { itemStatus, STATUS_ORDER } from '../src/practice/status.js';

const ITEM = { id: 'voicing:C:x32010', reviewIntervalDays: 1 };

// Makes `clean` clean and `dirty` unclean clean-checks, plus recall reps.
function reps(clean, dirty, recalls = 0) {
  const list = [];
  for (let index = 0; index < dirty; index++) list.push({ itemId: ITEM.id, kind: 'clean-check', clean: false, mistakes: [] });
  for (let index = 0; index < clean; index++) list.push({ itemId: ITEM.id, kind: 'clean-check', clean: true, mistakes: [] });
  for (let index = 0; index < recalls; index++) list.push({ itemId: ITEM.id, kind: 'recall', success: true });
  return list;
}

describe('status labels', () => {
  it('climb with the evidence, each naming what the next needs', () => {
    expect(itemStatus(ITEM, reps(1, 0))).toEqual({ label: 'New', next: '2 more measured reps to get a clean rate' });
    expect(itemStatus(ITEM, reps(2, 3)).label).toBe('Learning');
    expect(itemStatus(ITEM, reps(7, 3))).toEqual({ label: 'Steady', next: '8 of 10 clean and one recall from memory for Fluent' });
    expect(itemStatus(ITEM, reps(9, 1)).next).toBe('one recall from memory for Fluent');
    expect(itemStatus(ITEM, reps(9, 1, 1)).label).toBe('Fluent');
    expect(itemStatus({ ...ITEM, reviewIntervalDays: 8 }, reps(10, 0, 1)).label).toBe('In the fingers');
  });

  it('never has a final state without a next step', () => {
    const top = itemStatus({ ...ITEM, reviewIntervalDays: 16 }, reps(10, 0, 2));
    expect(top.label).toBe(STATUS_ORDER[STATUS_ORDER.length - 1]);
    expect(top.next).toMatch(/openings/);
  });
});

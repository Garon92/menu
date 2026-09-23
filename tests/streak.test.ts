import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  (await import('../kit/storage')).__resetStorageForTests();
  return import('../kit/streak');
}

beforeEach(() => localStorage.clear());

describe('createDaily', () => {
  it('counts today, detects reaching the goal once, tracks streaks', async () => {
    const { createDaily } = await fresh();
    const d = createDaily('matematika', { goal: 3 });
    const mon = new Date(2026, 8, 21, 10);
    const tue = new Date(2026, 8, 22, 10);
    const thu = new Date(2026, 8, 24, 10);
    expect(d.record(1, mon)).toMatchObject({ today: 1, reachedNow: false, streak: 1 });
    expect(d.record(2, mon)).toMatchObject({ today: 3, reachedNow: true });
    expect(d.record(1, mon).reachedNow).toBe(false);
    expect(d.streak(tue)).toBe(1); // yesterday counts until today is practised
    d.record(1, tue);
    expect(d.streak(tue)).toBe(2);
    expect(d.bestStreak()).toBe(2);
    expect(d.streak(thu)).toBe(0);
    d.record(1, thu);
    expect(d.streak(thu)).toBe(1);
    expect(d.bestStreak()).toBe(2);
    const week = d.week(thu);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ isToday: true, count: 1, done: false });
    expect(week.find((w) => w.date === '2026-09-21')).toMatchObject({ count: 4, done: true });
    expect(d.todayProgress(thu)).toBeCloseTo(1 / 3);
  });
});

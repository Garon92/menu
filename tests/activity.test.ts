import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  const storage = await import('../kit/storage');
  storage.__resetStorageForTests();
  return import('../kit/activity');
}

beforeEach(() => localStorage.clear());

describe('activity', () => {
  it('records last opened, merges metrics and counts sessions', async () => {
    const { recordActivity, getActivity } = await fresh();
    const t0 = 1_700_000_000_000;
    recordActivity('tanky', {}, t0);
    recordActivity('tanky', { metric: { label: 'Rekord', value: 100 } }, t0 + 1000);
    recordActivity('tanky', { progress: 1.7 }, t0 + 2000);
    let e = getActivity('tanky')!;
    expect(e.lastOpened).toBe(t0 + 2000);
    expect(e.sessions).toBe(1);
    expect(e.metric).toEqual({ label: 'Rekord', value: 100 });
    expect(e.progress).toBe(1);
    recordActivity('tanky', { metric: null }, t0 + 3 * 3600_000);
    e = getActivity('tanky')!;
    expect(e.metric).toBeUndefined();
    expect(e.sessions).toBe(2);
  });

  it('lists recent apps newest first and clears', async () => {
    const { recordActivity, recentApps, clearActivity, getActivity } = await fresh();
    recordActivity('a', {}, 1000);
    recordActivity('b', {}, 3000);
    recordActivity('c', {}, 2000);
    expect(recentApps(2).map((r) => r.id)).toEqual(['b', 'c']);
    clearActivity('b');
    expect(Object.keys(getActivity())).toEqual(['a', 'c']);
    clearActivity();
    expect(getActivity()).toEqual({});
  });

  it('notifies subscribers', async () => {
    const { recordActivity, subscribeActivity } = await fresh();
    const fn = vi.fn();
    subscribeActivity(fn);
    recordActivity('x');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('formats Czech relative time', async () => {
    const { timeAgo } = await fresh();
    const now = new Date(2026, 8, 23, 15, 0).getTime();
    expect(timeAgo(now - 10_000, now)).toBe('právě teď');
    expect(timeAgo(now - 60_000, now)).toBe('před minutou');
    expect(timeAgo(now - 5 * 60_000, now)).toBe('před 5 minutami');
    expect(timeAgo(now - 3 * 3600_000, now)).toBe('před 3 hodinami');
    expect(timeAgo(new Date(2026, 8, 22, 20, 0).getTime(), now)).toBe('včera');
    expect(timeAgo(new Date(2026, 8, 20, 10, 0).getTime(), now)).toBe('před 3 dny');
    expect(timeAgo(new Date(2026, 8, 9).getTime(), now)).toBe('před 2 týdny');
    expect(timeAgo(new Date(2026, 5, 1).getTime(), now)).toBe('před 3 měsíci');
    expect(timeAgo(new Date(2025, 5, 1).getTime(), now)).toBe('před rokem');
  });
});

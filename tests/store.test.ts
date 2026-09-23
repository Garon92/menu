import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  const storage = await import('../kit/storage');
  storage.__resetStorageForTests();
  return import('../kit/store');
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('createStore', () => {
  it('returns defaults and persists values under g92:<app>:<key>', async () => {
    const { createStore } = await fresh();
    const s = createStore('tanky', { defaults: { best: 0, name: 'x', list: [] as number[] } });
    expect(s.get('best')).toBe(0);
    s.set('best', 42);
    s.update('list', (l) => [...l, 1]);
    expect(localStorage.getItem('g92:tanky:best')).toBe('42');
    const again = createStore('tanky', { defaults: { best: 0, name: 'x', list: [] as number[] } });
    expect(again.get('best')).toBe(42);
    expect(again.get('list')).toEqual([1]);
    expect(again.all()).toEqual({ best: 42, name: 'x', list: [1] });
  });

  it('does not share mutable default objects', async () => {
    const { createStore } = await fresh();
    const defaults = { list: [] as number[] };
    const s = createStore('a', { defaults });
    s.get('list').push(5);
    s.reset('list');
    expect(s.get('list')).toEqual([]);
    expect(defaults.list).toEqual([]);
  });

  it('runs migrations once and adopts legacy keys', async () => {
    localStorage.setItem('tankHighScore', '1200');
    const { createStore } = await fresh();
    const migrate = vi.fn((from: number, m: import('../kit/store').MigrationApi<{ best: number }>) => {
      if (from < 1) m.adopt('tankHighScore', 'best', Number);
    });
    const s = createStore('tanky', { version: 2, defaults: { best: 0 }, migrate });
    expect(migrate).toHaveBeenCalledWith(0, expect.anything());
    expect(s.get('best')).toBe(1200);
    expect(localStorage.getItem('tankHighScore')).toBeNull();
    expect(localStorage.getItem('g92:tanky:__version')).toBe('2');
    createStore('tanky', { version: 2, defaults: { best: 0 }, migrate });
    expect(migrate).toHaveBeenCalledTimes(1);
    createStore('tanky', { version: 3, defaults: { best: 0 }, migrate });
    expect(migrate).toHaveBeenLastCalledWith(2, expect.anything());
  });

  it('submitBest handles higher and lower-is-better', async () => {
    const { createStore } = await fresh();
    const s = createStore('g', { defaults: { best: 0, time: 0 } });
    expect(s.submitBest('best', 10)).toEqual({ best: 10, isNewBest: true });
    expect(s.submitBest('best', 5)).toEqual({ best: 10, isNewBest: false });
    expect(s.submitBest('best', 10)).toEqual({ best: 10, isNewBest: false });
    expect(s.submitBest('time', 30, { lowerIsBetter: true })).toEqual({ best: 30, isNewBest: true });
    expect(s.submitBest('time', 25, { lowerIsBetter: true })).toEqual({ best: 25, isNewBest: true });
    expect(s.submitBest('time', 40, { lowerIsBetter: true })).toEqual({ best: 25, isNewBest: false });
  });

  it('notifies subscribers', async () => {
    const { createStore } = await fresh();
    const s = createStore('g', { defaults: { a: 1 } });
    const fn = vi.fn();
    const off = s.subscribe(fn);
    s.set('a', 2);
    expect(fn).toHaveBeenCalledWith('a', 2);
    off();
    s.set('a', 3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps working when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    const { createStore } = await fresh();
    const s = createStore('g', { defaults: { a: 1 } });
    expect(() => s.set('a', 5)).not.toThrow();
    expect(s.get('a')).toBe(5);
  });

  it('survives corrupt JSON', async () => {
    localStorage.setItem('g92:g:a', '{not json');
    const { createStore } = await fresh();
    const s = createStore('g', { defaults: { a: 7 } });
    expect(s.get('a')).toBe(7);
  });
});

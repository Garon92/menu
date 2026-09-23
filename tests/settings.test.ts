import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
  vi.resetModules();
  const storage = await import('../kit/storage');
  storage.__resetStorageForTests();
  return import('../kit/settings');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-motion');
});

describe('settings', () => {
  it('has sane defaults', async () => {
    const { getSettings } = await fresh();
    expect(getSettings()).toEqual({ sound: true, volume: 0.7, theme: 'auto', reducedMotion: 'auto', playerName: '', voice: true });
  });

  it('persists, sanitizes and applies to <html>', async () => {
    const { setSettings, getSettings, SETTINGS_KEY } = await fresh();
    setSettings({ theme: 'dark', volume: 3, reducedMotion: 'on', playerName: '  Adámek ' });
    const s = getSettings();
    expect(s.volume).toBe(1);
    expect(s.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) as string).theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.scheme).toBe('dark');
    expect(document.documentElement.dataset.motion).toBe('reduce');
    setSettings({ theme: 'auto', reducedMotion: 'auto' });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.hasAttribute('data-motion')).toBe(false);
  });

  it('ignores invalid stored values', async () => {
    localStorage.setItem('g92:settings', JSON.stringify({ theme: 'purple', sound: 'yes', volume: 'loud' }));
    const { getSettings } = await fresh();
    expect(getSettings()).toMatchObject({ theme: 'auto', sound: true, volume: 0.7 });
  });

  it('notifies subscribers and exposes a stable snapshot', async () => {
    const { settings } = await fresh();
    const fn = vi.fn();
    settings.subscribe(fn);
    const a = settings.snapshot();
    expect(settings.snapshot()).toBe(a);
    settings.set({ sound: false });
    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.calls[0]?.[0].sound).toBe(false);
    expect(settings.snapshot()).not.toBe(a);
    expect(Object.isFrozen(settings.snapshot())).toBe(true);
  });

  it('syncs from other tabs via the storage event', async () => {
    const { settings } = await fresh();
    const fn = vi.fn();
    settings.subscribe(fn);
    localStorage.setItem('g92:settings', JSON.stringify({ sound: false, theme: 'light' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'g92:settings' }));
    expect(settings.get()).toMatchObject({ sound: false, theme: 'light' });
    expect(fn).toHaveBeenCalled();
  });
});

describe('player names', () => {
  it('uses the family default unless the app has its own override', async () => {
    const { setSettings, getPlayerName, setAppPlayerName, getAppPlayerName, subscribeSettings } = await fresh();
    setSettings({ playerName: 'Adámek' });
    expect(getPlayerName('anglictina')).toBe('Adámek');
    expect(getPlayerName()).toBe('Adámek');
    const fn = vi.fn();
    subscribeSettings(fn);
    setAppPlayerName('anglictina', '  Tomáš ');
    expect(fn).toHaveBeenCalled();
    expect(getAppPlayerName('anglictina')).toBe('Tomáš');
    expect(getPlayerName('anglictina')).toBe('Tomáš');
    expect(getPlayerName('cestina')).toBe('Adámek');
    expect(localStorage.getItem('g92:anglictina:name')).toBe('"Tomáš"');
    setAppPlayerName('anglictina', null);
    expect(getPlayerName('anglictina')).toBe('Adámek');
    expect(localStorage.getItem('g92:anglictina:name')).toBeNull();
  });

  it('keeps an explicit voice=false and defaults missing voice to true', async () => {
    localStorage.setItem('g92:settings', JSON.stringify({ sound: false }));
    let m = await fresh();
    expect(m.getSettings().voice).toBe(true);
    localStorage.setItem('g92:settings', JSON.stringify({ voice: false }));
    m = await fresh();
    expect(m.getSettings().voice).toBe(false);
  });
});

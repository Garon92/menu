import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../kit/appbar';
import { getActivity, metricText, recordActivity, timeAgoShort } from '../kit/activity';
import { confirmDialog, isDialogOpen, openDialog } from '../kit/dialog';
import { DIFFICULTIES_3, HELP_TITLE_GAME, HELP_TITLE_LEARN, LABELS } from '../kit/labels';
import { guardLeave, setLeaveGuard, canLeave } from '../kit/nav';
import { showPause, showResults, autoPause } from '../kit/overlay';
import { g92NotFoundPage, g92Pwa, pwaTitle } from '../kit/pwa';
import { resetApp } from '../kit/reset';
import { createDaily } from '../kit/streak';
import { helpTitle } from '../kit/help';
import { appTitle } from '../kit/apps';
import { toast } from '../kit/toast';
import { setSettings } from '../kit/settings';
import { speak } from '../kit/speech';

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('metrics (C-16)', () => {
  it('renders one grammatical form', () => {
    expect(metricText({ value: 58, unit: ['hvězda', 'hvězdy', 'hvězd'] })).toBe('58 hvězd');
    expect(metricText({ value: 1, unit: ['hvězda', 'hvězdy', 'hvězd'] })).toBe('1 hvězda');
    expect(metricText({ value: 12, of: 59, unit: ['ryba', 'ryby', 'ryb'] })).toBe('12 z 59 ryb');
    expect(metricText({ label: 'Rekord', value: 12840 })).toMatch(/^Rekord: 12\s840$/);
    expect(metricText({ label: 'Rekord', value: 3, unit: ['bod', 'body', 'bodů'] })).toBe('Rekord: 3 body');
    expect(timeAgoShort(Date.now())).toBe('právě teď');
  });

  it('stores unit, of and a same-app deep link', () => {
    recordActivity('matematika', { metric: { value: 5, unit: ['hvězda', 'hvězdy', 'hvězd'] }, href: '/matematika/#/uroven/3', note: 'Úroveň 3' });
    recordActivity('tanky', { href: '/ryby/' });
    expect(getActivity('matematika')).toMatchObject({ metric: { value: 5, unit: ['hvězda', 'hvězdy', 'hvězd'] }, href: '/matematika/#/uroven/3' });
    expect(getActivity('tanky')?.href).toBeUndefined();
  });
});

describe('resetApp (C-17)', () => {
  it('removes app keys, daily and activity but keeps the offline flag and other apps', () => {
    localStorage.setItem('g92:cestina:progress', '{"a":1}');
    localStorage.setItem('g92:cestina:name', '"Adámek"');
    localStorage.setItem('g92:cestina:offline', '1');
    localStorage.setItem('g92:matematika:best', '5');
    createDaily('cestina', { goal: 3 }).record(2);
    recordActivity('cestina', { note: 'x' });
    recordActivity('matematika');
    const removed = resetApp('cestina');
    expect(removed).toEqual(expect.arrayContaining(['g92:cestina:progress', 'g92:cestina:name', 'g92:cestina:daily']));
    expect(localStorage.getItem('g92:cestina:offline')).toBe('1');
    expect(localStorage.getItem('g92:matematika:best')).toBe('5');
    expect(getActivity('cestina')).toBeUndefined();
    expect(getActivity('matematika')).toBeDefined();
  });
});

describe('dialogs (C-03, C-05)', () => {
  it('confirmDialog focuses cancel; danger never defaults to the destructive button', async () => {
    const p = confirmDialog({ title: 'Smazat?', danger: true, confirmLabel: 'Smazat' });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('dialog .g92-dialog__foot button')];
    expect(buttons.find((b) => b.hasAttribute('autofocus'))?.textContent).toBe(LABELS.cancel);
    buttons[0]?.click();
    await expect(p).resolves.toBe(false);
  });

  it('defaultConfirm focuses confirm only when not dangerous', () => {
    void confirmDialog({ title: 'Uložit?', defaultConfirm: true, confirmLabel: 'Uložit' });
    const auto = document.querySelector<HTMLButtonElement>('dialog button[autofocus]');
    expect(auto?.textContent).toBe('Uložit');
  });

  it('emits g92-dialog-open/close and autoPause pauses on it', async () => {
    const events: string[] = [];
    document.addEventListener('g92-dialog-open', () => events.push('open'));
    document.addEventListener('g92-dialog-close', () => events.push('close'));
    const pause = vi.fn();
    const off = autoPause(pause);
    const d = openDialog({ title: 'Nápověda', kind: 'help' });
    expect(isDialogOpen()).toBe(true);
    expect(pause).toHaveBeenCalledTimes(1);
    d.close();
    await d.closed;
    expect(events).toEqual(['open', 'close']);
    expect(isDialogOpen()).toBe(false);
    off();
  });
});

describe('leave guard (C-01)', () => {
  it('g92-back is cancelable and the guard decides', async () => {
    const bar = document.createElement('g92-appbar');
    bar.setAttribute('app', 'komari');
    document.body.append(bar);
    const back = bar.shadowRoot!.querySelector<HTMLAnchorElement>('.back')!;
    expect(back.textContent).toContain(LABELS.menu);
    expect(back.innerHTML).not.toContain('M15 5l-7 7 7 7'); // no bare chevron
    const onBack = vi.fn((e: Event) => e.preventDefault());
    bar.addEventListener('g92-back', onBack);
    back.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(onBack).toHaveBeenCalledOnce();

    const guard = vi.fn(() => false);
    const off = setLeaveGuard(guard);
    expect(await canLeave()).toBe(false);
    off();
    expect(await canLeave()).toBe(true);
  });

  it('guardLeave only asks while active and pauses first', async () => {
    let active = false;
    const onPause = vi.fn();
    const off = guardLeave({ isActive: () => active, onPause });
    expect(await canLeave()).toBe(true);
    active = true;
    const p = canLeave();
    await Promise.resolve();
    const dlg = document.querySelector('dialog')!;
    expect(dlg.textContent).toContain('Odejít do menu?');
    expect(dlg.textContent).toContain('Rozehraná hra se neuloží.');
    expect(dlg.querySelector('button[autofocus]')?.textContent).toContain(LABELS.stay);
    expect(onPause).toHaveBeenCalledOnce();
    [...dlg.querySelectorAll('button')].find((b) => b.textContent === LABELS.leave)!.click();
    await expect(p).resolves.toBe(true);
    off();
  });
});

describe('overlays (C-07, C-14)', () => {
  it('pause uses the family words and offers quit', async () => {
    const p = showPause({ menuHref: null, quit: true });
    const text = p.el.textContent ?? '';
    expect(text).toContain(LABELS.resume);
    expect(text).toContain(LABELS.again);
    expect(text).toContain(LABELS.quit);
    expect(text).not.toMatch(/(^|[^á])Znovu/);
    [...p.el.querySelectorAll('button')].find((b) => b.textContent === LABELS.quit)!.click();
    await expect(p).resolves.toBe('quit');
  });

  it('results: no duplicate "Nový rekord", plural score unit', () => {
    const a = showResults({ score: 1, isNewBest: true, celebrate: false, menuHref: null });
    expect((a.el.textContent ?? '').match(/Nový rekord/g)).toHaveLength(1);
    expect(a.el.querySelector('.g92-overlay__score-label')?.textContent).toBe('bod');
    a.close('menu');
    const b = showResults({ score: 3, celebrate: false, menuHref: null, scoreLabel: ['komár', 'komáři', 'komárů'] });
    expect(b.el.querySelector('.g92-overlay__score-label')?.textContent).toBe('komáři');
    b.close('menu');
    const c = showResults({ score: 25, title: 'Hotovo!', isNewBest: true, celebrate: false, menuHref: null });
    expect(c.el.querySelector('.g92-overlay__newbest')).not.toBeNull();
    expect(c.el.querySelector('.g92-overlay__score-label')?.textContent).toBe('bodů');
  });
});

describe('vocabulary + titles (C-09, C-12, C-19)', () => {
  it('exports the family constants', () => {
    expect(DIFFICULTIES_3.map((d) => d.label)).toEqual(['Lehká', 'Normální', 'Těžká']);
    expect(helpTitle('komari')).toBe(HELP_TITLE_GAME);
    expect(helpTitle('matematika')).toBe(HELP_TITLE_LEARN);
    expect(appTitle('komari')).toBe('Komáři – Plácni je všechny!');
    expect(appTitle('menu')).toBe('Garon92 – hry a učení');
    expect(pwaTitle('tanky')).toBe('Tanky – Tanková bitva');
    const m = g92Pwa('menu');
    expect(m.manifest.short_name).toBe('Hry a učení');
    expect(m.workbox.globIgnores).toContain('**/*italic*');
  });

  it('appbar help label is Nápověda', () => {
    const bar = document.createElement('g92-appbar');
    bar.setAttribute('app', 'ryby');
    document.body.append(bar);
    expect(bar.shadowRoot!.querySelector('.help')?.getAttribute('aria-label')).toBe('Nápověda');
  });
});

describe('404 plugin (C-23)', () => {
  it('emits a Czech page, or a copy of index.html for SPAs', () => {
    const files: { fileName: string; source: string | Uint8Array }[] = [];
    const ctx = { emitFile: (f: { fileName: string; source: string | Uint8Array }) => (files.push(f), 'x') };
    g92NotFoundPage('ryby').generateBundle.call(ctx, {}, {});
    expect(files[0]?.fileName).toBe('404.html');
    expect(String(files[0]?.source)).toContain('Zpět do aplikace');
    expect(String(files[0]?.source)).toContain('href="/ryby/"');
    g92NotFoundPage('anglictina', { spa: true }).generateBundle.call(ctx, {}, { 'index.html': { type: 'asset', source: '<html>app</html>' } });
    expect(files[1]?.source).toBe('<html>app</html>');
  });
});

describe('toast (C-04) + speech (C-13)', () => {
  it('toasts never catch taps except the action', () => {
    toast('Uloženo', { action: { label: 'Zpět', onClick: () => undefined } });
    const region = document.querySelector('.g92-toasts');
    expect(region).not.toBeNull();
    expect(document.querySelector('.g92-toast__action')).not.toBeNull();
  });

  it('automatic speech respects voice, tapped speech ignores it', () => {
    const spoken: string[] = [];
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      cancel() {},
      getVoices: () => [],
      speak: (u: { text: string }) => spoken.push(u.text),
    };
    (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: unknown = null;
      constructor(public text: string) {}
    };
    setSettings({ voice: false, sound: false });
    expect(speak('úkol', { auto: true })).toBe(false);
    expect(speak('kapr')).toBe(true);
    setSettings({ voice: true });
    expect(speak('úkol', { auto: true })).toBe(true);
    expect(spoken).toEqual(['kapr', 'úkol']);
  });
});

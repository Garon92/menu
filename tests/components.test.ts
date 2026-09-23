import { beforeEach, describe, expect, it } from 'vitest';
import '../kit/appbar';
import { getActivity } from '../kit/activity';
import { showResults, showStart, showPause } from '../kit/overlay';
import { setHelp } from '../kit/help';
import { starsHTML, h } from '../kit/dom';
import { toast } from '../kit/toast';

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  localStorage.clear();
});

describe('<g92-appbar>', () => {
  it('renders app name, sets accent and records activity', () => {
    const bar = document.createElement('g92-appbar');
    bar.setAttribute('app', 'tanky');
    document.body.append(bar);
    const root = bar.shadowRoot!;
    expect(root.querySelector('.name')?.textContent).toBe('Tanky');
    expect(root.querySelector('.back')?.hasAttribute('hidden')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ef5350');
    expect(getActivity('tanky')?.lastOpened).toBeTypeOf('number');
  });

  it('hides the back link on the menu and honours heading / no-activity', () => {
    const bar = document.createElement('g92-appbar');
    bar.setAttribute('app', 'menu');
    bar.setAttribute('heading', 'Rozcestník');
    document.body.append(bar);
    expect((bar.shadowRoot!.querySelector('.back') as HTMLElement).hidden).toBe(true);
    expect(bar.shadowRoot!.querySelector('.name')?.textContent).toBe('Rozcestník');
    expect(getActivity('menu')).toBeUndefined();
  });

  it('shows the help button when help is registered', () => {
    const bar = document.createElement('g92-appbar');
    bar.setAttribute('app', 'komari');
    document.body.append(bar);
    expect((bar.shadowRoot!.querySelector('.help') as HTMLElement).hidden).toBe(true);
    const off = setHelp({ howTo: [{ icon: '👆', text: 'Klepni' }] });
    expect(bar.hasAttribute('help')).toBe(true);
    expect((bar.shadowRoot!.querySelector('.help') as HTMLElement).hidden).toBe(false);
    off();
    expect(bar.hasAttribute('help')).toBe(false);
  });
});

describe('overlays', () => {
  it('showStart resolves with the chosen difficulty', async () => {
    const p = showStart({
      appId: 'komari',
      difficulties: [
        { id: 'easy', label: 'Lehká' },
        { id: 'hard', label: 'Těžká' },
      ],
      difficulty: 'easy',
      howTo: [{ icon: '👆', text: 'Klepni' }],
    });
    expect(p.el.querySelector('.g92-overlay__title')?.textContent).toBe('Komáři');
    const hard = p.el.querySelector<HTMLInputElement>('input[value="hard"]')!;
    hard.checked = true;
    hard.dispatchEvent(new Event('change'));
    (p.el.querySelector('.g92-overlay__play') as HTMLButtonElement).click();
    await expect(p).resolves.toEqual({ difficulty: 'hard' });
  });

  it('showPause resolves resume on Escape', async () => {
    const p = showPause({ menuHref: null });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(p).resolves.toBe('resume');
  });

  it('showResults shows stars, new-best badge and resolves again', async () => {
    const p = showResults({ score: 120, best: 120, isNewBest: true, stars: 2, celebrate: false, menuHref: null });
    expect(p.el.querySelectorAll('.g92-star.is-on')).toHaveLength(2);
    expect(p.el.textContent).toContain('Nový rekord');
    (p.el.querySelector('[data-primary]') as HTMLButtonElement).click();
    await expect(p).resolves.toBe('again');
  });
});

describe('dom helpers', () => {
  it('starsHTML renders accessible stars', () => {
    const el = h('div', { html: starsHTML(1, 3) });
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('1 hvězda z 3');
    expect(el.querySelectorAll('.g92-star')).toHaveLength(3);
  });

  it('toast renders an action button', () => {
    let clicked = false;
    toast('Nová verze', { action: { label: 'Obnovit', onClick: () => (clicked = true) } });
    const btn = document.querySelector<HTMLButtonElement>('.g92-toast__action')!;
    expect(btn.textContent).toBe('Obnovit');
    btn.click();
    expect(clicked).toBe(true);
  });
});

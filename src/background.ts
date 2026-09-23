import { APPS } from '../kit';
import { rng } from './util';

/**
 * Soft animated backdrop: a few large accent glows + small floating shapes
 * (circle / square / triangle / diamond — the family's playful vocabulary).
 * Pure CSS animation on transform/opacity; static when reduced motion is on.
 */
export function buildBackground(root: HTMLElement, opts: { animate: boolean }): void {
  if (!root) return;
  root.classList.toggle('is-static', !opts.animate);
  const colors = APPS.filter((a) => a.id !== 'menu').map((a) => a.accent);
  const r = rng(92);
  const frag = document.createDocumentFragment();

  ['a', 'b', 'c'].forEach((k) => {
    const g = document.createElement('span');
    g.className = `menu-bg__glow menu-bg__glow--${k}`;
    frag.append(g);
  });

  const shapes = ['circle', 'square', 'triangle', 'diamond', 'ring'];
  const count = innerWidth < 600 ? 10 : 18;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = `menu-bg__shape menu-bg__shape--${shapes[i % shapes.length]}`;
    const size = 10 + Math.round(r() * 18);
    s.style.cssText = [
      `--x:${(r() * 100).toFixed(1)}%`,
      `--y:${(r() * 100).toFixed(1)}%`,
      `--s:${size}px`,
      `--c:${colors[i % colors.length]}`,
      `--d:${(18 + r() * 22).toFixed(1)}s`,
      `--delay:${(-r() * 30).toFixed(1)}s`,
      `--rot:${Math.round(r() * 360)}deg`,
      `--dx:${Math.round((r() - 0.5) * 80)}px`,
      `--dy:${Math.round(-40 - r() * 80)}px`,
    ].join(';');
    frag.append(s);
  }
  root.append(frag);
}

#!/usr/bin/env node
// Appbar fit check: 360/390 px with 1 slotted action + help + sound + fullscreen + settings, plus Esc→dialog.
import { chromium } from 'playwright-core';
import path from 'node:path';
const out = path.resolve(process.argv[2] ?? '../_night/shots/menu');
const base = process.argv[3] ?? 'http://localhost:5170/menu/kit.html';
const b = await chromium.launch({ channel: 'chrome' });
let fail = 0;
for (const [app, width] of [['ryby', 390], ['komari', 390], ['ryby', 360], ['komari', 360], ['spojovacka', 390], ['anglictina', 360], ['dots', 414]]) {
  const p = await b.newPage({ viewport: { width, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.evaluate((app) => {
    const bar = document.querySelector('g92-appbar');
    bar.setAttribute('app', app);
    bar.removeAttribute('heading');
    bar.setAttribute('help', '');
    bar.setAttribute('fullscreen', '');
    const btn = document.createElement('button');
    btn.slot = 'actions';
    btn.className = 'g92-btn g92-btn--ghost g92-btn--icon';
    btn.setAttribute('aria-label', 'Pauza');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.8" height="14" rx="1.2"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2"/></svg>';
    bar.append(btn);
  }, app);
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bar = document.querySelector('g92-appbar');
    const sr = bar.shadowRoot;
    const name = sr.querySelector('.name:not(.measure)');
    const barEl = sr.querySelector('.bar');
    return {
      collapsed: bar.hasAttribute('data-title-collapsed'),
      truncated: !name.classList.contains('is-collapsed') && name.scrollWidth > name.clientWidth + 1,
      overflow: barEl.scrollWidth > barEl.clientWidth + 1,
      buttons: [...sr.querySelectorAll('.btn')].filter((x) => !x.hidden).length + 1,
    };
  });
  const ok = !r.truncated && !r.overflow;
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${app} @${width}px: ${r.collapsed ? 'icon only' : 'name shown'}, ${r.buttons} action buttons, truncated=${r.truncated}, overflow=${r.overflow}`);
  await p.screenshot({ path: path.join(out, `appbar-${app}-${width}.png`), clip: { x: 0, y: 0, width, height: 64 } });
  await p.close();
}
// Esc keydown opening a confirm dialog must keep it open
{
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    const kit = await import(document.querySelector('script[type=module]')?.src ?? '');
    void kit;
  }).catch(() => undefined);
  await p.evaluate(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || document.querySelector('dialog[open]') || window.__opened) return;
      window.__opened = true;
      document.querySelector('[data-demo="confirm"]').click();
    });
  });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  const open = await p.evaluate(() => !!document.querySelector('dialog[open]'));
  console.log(`${open ? '✓' : '✗'} dialog opened from an Escape keydown stays open`);
  if (!open) fail++;
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  const closed = await p.evaluate(() => !document.querySelector('dialog[open]'));
  console.log(`${closed ? '✓' : '✗'} second Escape closes it`);
  if (!closed) fail++;
}
await b.close();
process.exit(fail ? 1 : 0);

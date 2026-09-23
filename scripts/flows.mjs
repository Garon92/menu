#!/usr/bin/env node
// Interaction checks for the menu (needs `npm run preview` on :5170): first run name entry,
// keyboard focus, settings dialog, daily chips, reduced motion. Screenshots → outDir.
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const out = path.resolve(process.argv[2] ?? '../_night/shots/menu');
const base = process.argv[3] ?? 'http://localhost:5170/menu/';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let failures = 0;
const check = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

async function ctx(opts = {}) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, locale: 'cs-CZ', serviceWorkers: 'block', ...opts });
  const p = await c.newPage();
  p.on('pageerror', (e) => { failures++; console.log('pageerror', e.message); });
  p.on('console', (m) => { if (m.type() === 'error') { failures++; console.log('console.error', m.text()); } });
  return { c, p };
}

// 1) first run → enter name
{
  const { c, p } = await ctx();
  await p.goto(base, { waitUntil: 'networkidle' });
  check(await p.isVisible('.welcome__form'), 'first run shows welcome + name form');
  await p.click('.welcome__form button');
  check(await p.$eval('#welcome-name', (e) => e.classList.contains('is-error')), 'empty name → input marked as error');
  await p.fill('#welcome-name', 'Adámek');
  await p.press('#welcome-name', 'Enter');
  await p.waitForTimeout(400);
  const title = await p.textContent('.hero__title');
  check(/Adámku!/.test(title ?? ''), `greeting uses vocative: "${title?.trim()}"`);
  check(!(await p.$('.welcome__form')), 'name form disappears after saving');
  check(await p.isVisible('.g92-toast'), 'toast confirms the name');
  await p.screenshot({ path: path.join(out, 'flow-name-saved.png') });
  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('g92:settings') || '{}').playerName);
  check(stored === 'Adámek', 'name persisted in g92:settings');
  await c.close();
}

// 2) keyboard: Tab reaches cards with a visible focus ring; Enter navigates
{
  const { c, p } = await ctx();
  await p.addInitScript(() => localStorage.setItem('g92:settings', JSON.stringify({ playerName: 'Ema' })));
  await p.goto(base, { waitUntil: 'networkidle' });
  let focusedCard = null;
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab');
    focusedCard = await p.evaluate(() => document.activeElement?.closest('.app-card')?.getAttribute('data-app') ?? null);
    if (focusedCard) break;
  }
  check(focusedCard === 'matematika', `first card reachable by Tab (${focusedCard})`);
  const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check(outline === 'solid', 'focused card has a visible outline');
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'flow-keyboard-focus.png') });
  await c.close();
}

// 3) settings dialog from footer, theme switch applies immediately, Esc closes
{
  const { c, p } = await ctx();
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.click('[data-action="settings"]');
  await p.waitForSelector('dialog[open]');
  check(await p.isVisible('dialog[open] >> text=Historie v menu'), 'menu adds its own section to settings');
  await p.click('dialog[open] label:has-text("Tmavý")');
  check((await p.getAttribute('html', 'data-theme')) === 'dark', 'theme switch applies to <html>');
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'flow-settings-dark.png') });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  check(!(await p.$('dialog[open]')), 'Esc closes the dialog');
  await c.close();
}

// 4) daily chips + reduced motion (static background, no invisible cards)
{
  const { c, p } = await ctx({ reducedMotion: 'reduce', viewport: { width: 820, height: 1180 } });
  await p.addInitScript(() => {
    const d = new Date();
    const key = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    const y2 = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 2);
    localStorage.setItem('g92:matematika:daily', JSON.stringify({ goal: 10, days: { [key(d)]: 7, [key(y)]: 12, [key(y2)]: 3 }, bestStreak: 3 }));
    localStorage.setItem('g92:cestina:daily', JSON.stringify({ goal: 5, days: { [key(d)]: 5 }, bestStreak: 1 }));
    localStorage.setItem('g92:activity', JSON.stringify({ matematika: { lastOpened: Date.now() - 5 * 60000, sessions: 3, progress: 0.3 } }));
  });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(100);
  const chips = await p.textContent('.hero__chips');
  check(/Série\s*3\s*dny/.test(chips ?? '') && /Dnes procvičeno\s*12/.test(chips ?? ''), `daily chips: "${chips?.replace(/\s+/g, ' ').trim()}"`);
  const opacity = await p.$eval('.app-card[data-app="dots"]', (e) => getComputedStyle(e).opacity);
  check(opacity === '1', 'reduced motion: cards visible immediately');
  await p.screenshot({ path: path.join(out, 'flow-tablet-reduced-motion.png'), fullPage: true });
  await c.close();
}

await browser.close();
console.log(failures ? `${failures} FAILURES` : 'all flows OK');
process.exit(failures ? 1 : 0);

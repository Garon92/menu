#!/usr/bin/env node
// QA regression checks for kit v0.7 at all QA viewports (needs `npm run preview` on :5170 + Google Chrome).
// Usage: node scripts/qa-check.mjs [outDir] [baseUrl]
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const out = path.resolve(process.argv[2] ?? '../_night/shots/menu/qa-v07');
const base = process.argv[3] ?? 'http://localhost:5170/menu/';
fs.mkdirSync(out, { recursive: true });

const VPS = {
  p360: { width: 360, height: 740, touch: true },
  p390: { width: 390, height: 844, touch: true },
  tabP: { width: 820, height: 1180, touch: true },
  tabL: { width: 1180, height: 820, touch: true },
  phoneL: { width: 844, height: 390, touch: true },
  desk: { width: 1440, height: 900, touch: false },
};
const now = Date.now();
const SEED = {
  'g92:settings': JSON.stringify({ playerName: 'Adámek' }),
  'g92:activity': JSON.stringify({
    tanky: { lastOpened: now - 2 * 86400000, sessions: 5, metric: { label: 'Rekord', value: 12450 } },
    matematika: { lastOpened: now - 3 * 3600000, sessions: 9, progress: 0.45, note: 'Sčítání do 20 přes desítku', metric: { value: 58, unit: ['hvězda', 'hvězdy', 'hvězd'] } },
    cestina: { lastOpened: now - 600000, sessions: 3, progress: 0.7, note: 'Slabiky' },
  }),
};

let fail = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail++;
};

const browser = await chromium.launch({ channel: 'chrome' });
async function page(vp, { seed = false, reduced = false } = {}) {
  const v = VPS[vp];
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 2,
    isMobile: v.touch && v.width < 1000,
    hasTouch: v.touch,
    locale: 'cs-CZ',
    serviceWorkers: 'block',
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  if (seed) await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, SEED);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { fail++; console.log(`  pageerror [${vp}]`, e.message); });
  p.on('console', (m) => {
    if (m.type() !== 'error' || /ERR_INTERNET_DISCONNECTED/.test(m.text())) return;
    fail++;
    console.log(`  console.error [${vp}]`, m.text());
  });
  return { ctx, p };
}

/** is the primary button fully visible and actually hit-testable? */
async function primaryVisible(p) {
  return p.evaluate(() => {
    const els = [...document.querySelectorAll('.g92-overlay [data-primary]')].filter((e) => e.offsetParent !== null);
    const b = els[els.length - 1];
    if (!b) return { found: false };
    const r = b.getBoundingClientRect();
    const inside = r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight + 0.5 && r.right <= innerWidth + 0.5;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { found: true, inside, hit: !!hit && (hit === b || b.contains(hit)), bottom: Math.round(r.bottom), vh: innerHeight };
  });
}

for (const vp of Object.keys(VPS)) {
  const { ctx, p } = await page(vp);
  await p.goto(base + 'kit.html', { waitUntil: 'networkidle' });
  // overlays — incl. a start screen with extra content (C-06)
  for (const demo of ['start', 'start+extra', 'howto', 'results', 'pause', 'lost']) {
    await p.evaluate(() => document.querySelectorAll('.g92-overlay').forEach((o) => o.remove()));
    if (demo === 'start+extra') {
      await p.click('[data-demo=start]');
      await p.waitForTimeout(350);
      await p.evaluate(() => {
        const note = document.createElement('div');
        note.className = 'g92-card g92-card--flat';
        note.style.textAlign = 'left';
        note.innerHTML = '<p>Poznámka hry s delším textem, odznaky, statistiky a vysvětlivkami, které panel natáhnou.</p>'.repeat(4);
        const actions = [...document.querySelectorAll('.g92-overlay .g92-overlay__actions')].find((a) => a.offsetParent !== null);
        actions?.parentElement?.insertBefore(note, actions);
      });
    } else if (demo === 'howto') {
      await p.click('[data-demo=start]');
      await p.waitForTimeout(350);
      await p.click('.g92-overlay .g92-btn--secondary');
    } else {
      await p.click(`[data-demo=${demo}]`);
    }
    await p.waitForTimeout(demo === 'results' ? 700 : 450);
    const r = await primaryVisible(p);
    ok(r.found && r.inside && r.hit, `[${vp}] ${demo}: primary button fully visible & tappable (bottom ${r.bottom}/${r.vh})`);
    if (['p360', 'phoneL'].includes(vp) || demo === 'start+extra') await p.screenshot({ path: path.join(out, `ov-${demo}-${vp}.png`) });
    await p.evaluate(() => document.querySelectorAll('.g92-overlay').forEach((o) => o.remove()));
    await p.evaluate(() => document.querySelectorAll('canvas.g92-confetti').forEach((c) => c.remove()));
  }
  // settings dialog (C-18)
  await p.click('[data-demo=settings]');
  await p.waitForTimeout(400);
  const d = await p.evaluate(() => {
    const dlg = document.querySelector('dialog[open]');
    const foot = dlg.querySelector('.g92-dialog__foot button').getBoundingClientRect();
    const body = dlg.querySelector('.g92-dialog__body');
    return { footInside: foot.bottom <= innerHeight && foot.top >= 0, body: Math.round(body.clientHeight), scroll: Math.round(body.scrollHeight) };
  });
  ok(d.footInside && d.body >= 180, `[${vp}] settings dialog: "Hotovo" visible, body ${d.body}px (content ${d.scroll}px)`);
  if (['phoneL', 'p360'].includes(vp)) await p.screenshot({ path: path.join(out, `settings-${vp}.png`) });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(350);
  // toast (C-04): top, below the appbar, taps pass through
  await p.click('[data-toast=success]');
  await p.waitForTimeout(400);
  const t = await p.evaluate(() => {
    const toastEl = document.querySelector('.g92-toast');
    const r = toastEl.getBoundingClientRect();
    const bar = document.querySelector('g92-appbar').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { belowBar: r.top >= bar.bottom - 1, upperHalf: r.bottom < innerHeight / 2, passThrough: !toastEl.contains(hit) };
  });
  ok(t.belowBar && t.upperHalf && t.passThrough, `[${vp}] toast below the appbar, top half, taps pass through`);
  // appbar (C-02): grid icon + label "Menu" when it fits, never a bare chevron
  const bar = await p.evaluate(() => {
    const sr = document.querySelector('g92-appbar').shadowRoot;
    const back = sr.querySelector('.back');
    const label = sr.querySelector('.back .label');
    const name = sr.querySelector('.name:not(.measure)');
    return {
      grid: back.innerHTML.includes('rect'),
      label: getComputedStyle(label).display !== 'none',
      truncated: !name.classList.contains('is-collapsed') && name.scrollWidth > name.clientWidth + 1,
      overflow: sr.querySelector('.bar').scrollWidth > sr.querySelector('.bar').clientWidth + 1,
    };
  });
  ok(bar.grid && !bar.truncated && !bar.overflow, `[${vp}] appbar: grid icon, label ${bar.label ? 'shown' : 'hidden'}, no truncation/overflow`);
  await ctx.close();
}

// menu first screen + continue row (MENU-01, MENU-10) + landscape
for (const vp of Object.keys(VPS)) {
  for (const seed of [false, true]) {
    const { ctx, p } = await page(vp, { seed });
    await p.goto(base, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const m = await p.evaluate(() => {
      const first = document.querySelector('.resume-card, .app-card');
      const r = first.getBoundingClientRect();
      const resumes = [...document.querySelectorAll('.resume-card')].map((c) => c.getBoundingClientRect());
      return {
        firstTop: Math.round(r.top),
        vh: innerHeight,
        resumeCut: resumes.some((x) => x.right > innerWidth + 1) && innerWidth >= 700,
        hscroll: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    ok(m.firstTop < m.vh - 60 && !m.resumeCut && !m.hscroll, `[${vp}] menu ${seed ? 'with progress' : 'fresh'}: first card at y=${m.firstTop}/${m.vh}, continue row not cut, no h-scroll`);
    await p.screenshot({ path: path.join(out, `menu-${seed ? 'progress' : 'fresh'}-${vp}.png`) });
    await ctx.close();
  }
}

// leave guard + history back (C-01, C-24)
{
  const { ctx, p } = await page('desk');
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.evaluate(() => { location.href = './kit.html'; });
  await p.waitForURL(/kit\.html/);
  await p.waitForLoadState('networkidle');
  const len0 = await p.evaluate(() => history.length);
  await p.click('[data-demo=guard]');
  await p.waitForTimeout(200);
  const back = p.locator('g92-appbar').locator('css=.back');
  await back.click();
  await p.waitForSelector('dialog[open]');
  const dlg = await p.evaluate(() => ({ text: document.querySelector('dialog[open]').textContent, focus: document.activeElement?.textContent }));
  ok(/Odejít do menu\?/.test(dlg.text) && /Zůstat/.test(dlg.focus ?? ''), 'guard: "Odejít do menu?" with "Zůstat" focused');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  ok(/kit\.html/.test(p.url()), 'guard: Enter (Zůstat) keeps the game');
  await back.click();
  await p.waitForSelector('dialog[open]');
  await p.getByRole('button', { name: 'Odejít', exact: true }).click();
  await p.waitForURL((u) => !/kit\.html/.test(String(u)), { timeout: 4000 }).catch(() => undefined);
  const url = p.url();
  const len1 = await p.evaluate(() => history.length);
  ok(/\/menu\/$/.test(url) && len1 === len0, `guard: "Odejít" goes back to the menu without a new history entry (${len0} → ${len1})`);
  await ctx.close();
}

// offline: never-opened app (MENU-06)
{
  const { ctx, p } = await page('p390', { seed: true });
  await p.goto(base, { waitUntil: 'networkidle' });
  await ctx.setOffline(true);
  await p.evaluate(() => window.dispatchEvent(new Event('offline')));
  await p.waitForTimeout(300);
  const note = await p.isVisible('.offline-note');
  await p.click('.app-card[data-app="komari"]');
  await p.waitForTimeout(400);
  const stay = /\/menu\/$/.test(p.url());
  const toastText = await p.textContent('.g92-toast').catch(() => '');
  ok(note && stay && /internetu/.test(toastText ?? ''), 'offline: note shown, tap on a never-opened app explains instead of a browser error');
  await p.screenshot({ path: path.join(out, 'menu-offline-p390.png') });
  await ctx.close();
}

await browser.close();
console.log(fail ? `${fail} FAILED` : 'all QA checks OK');
process.exit(fail ? 1 : 0);

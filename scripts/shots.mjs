#!/usr/bin/env node
// Headless screenshots of the menu + kit guide in several states (needs `npm run preview` on :5170 and Google Chrome).
// Usage: node scripts/shots.mjs [outDir=../_night/shots/menu] [baseUrl=http://localhost:5170/menu/]
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const out = path.resolve(process.argv[2] ?? '../_night/shots/menu');
const base = process.argv[3] ?? 'http://localhost:5170/menu/';
fs.mkdirSync(out, { recursive: true });

const now = Date.now();
const SEED = {
  'g92:settings': JSON.stringify({ playerName: 'Adámek' }),
  'g92:activity': JSON.stringify({
    tanky: { lastOpened: now - 2 * 86400000, sessions: 5, metric: { label: 'Rekord', value: 12450 } },
    matematika: { lastOpened: now - 3 * 3600000, sessions: 9, progress: 0.45, metric: { label: 'Příkladů', value: 312 } },
    spojovacka: { lastOpened: now - 600000, sessions: 2, metric: { label: 'Rekord', value: 8800 } },
    cestina: { lastOpened: now - 8 * 86400000, sessions: 3, progress: 0.7 },
  }),
};

const viewports = {
  desktop: { width: 1440, height: 900, mobile: false },
  tablet: { width: 820, height: 1180, mobile: true },
  mobile: { width: 390, height: 844, mobile: true },
};

const scenarios = [
  { name: 'menu-empty', url: '', seed: false, vps: ['desktop', 'mobile'], schemes: ['light'] },
  { name: 'menu', url: '', seed: true, vps: ['desktop', 'tablet', 'mobile'], schemes: ['light', 'dark'], full: true },
  { name: 'kit', url: 'kit.html', seed: false, vps: ['desktop', 'mobile'], schemes: ['light', 'dark'], full: true },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let errors = 0;
for (const sc of scenarios) {
  for (const vp of sc.vps) {
    for (const scheme of sc.schemes) {
      const v = viewports[vp];
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: 2,
        isMobile: v.mobile,
        hasTouch: v.mobile,
        colorScheme: scheme,
        locale: 'cs-CZ',
        serviceWorkers: 'block',
      });
      if (sc.seed) await ctx.addInitScript((seed) => { for (const [k, val] of Object.entries(seed)) localStorage.setItem(k, val); }, SEED);
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log(`[${sc.name}/${vp}/${scheme}] console.error: ${m.text()}`); } });
      page.on('pageerror', (e) => { errors++; console.log(`[${sc.name}/${vp}/${scheme}] pageerror: ${e.message}`); });
      await page.goto(base + sc.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1400);
      const file = path.join(out, `${sc.name}-${vp}-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: Boolean(sc.full) });
      console.log('saved', file);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(errors ? `${errors} console errors` : 'no console errors');
process.exit(errors ? 1 : 0);

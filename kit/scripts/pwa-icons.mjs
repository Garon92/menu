#!/usr/bin/env node
// Generate favicon.svg + PWA PNG icons for a g92 app from the kit registry (icon + accent).
// Usage: node --experimental-strip-types menu/kit/scripts/pwa-icons.mjs <appId> [outDir=./public]
// Needs Google Chrome installed and playwright-core resolvable (menu devDependency, or _night/tools).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [appId, outArg] = process.argv.slice(2);
if (!appId) {
  console.error('usage: node --experimental-strip-types pwa-icons.mjs <appId> [outDir]');
  process.exit(2);
}
const outDir = path.resolve(outArg ?? 'public');
fs.mkdirSync(outDir, { recursive: true });

let apps;
try {
  apps = await import(pathToFileURL(path.join(here, '..', 'apps.ts')).href);
} catch (e) {
  console.error('Cannot import apps.ts — run with: node --experimental-strip-types …\n', e.message);
  process.exit(1);
}
if (!apps.APP_BY_ID[appId]) {
  console.error(`unknown app "${appId}"`);
  process.exit(1);
}

function loadPlaywright() {
  const candidates = [path.join(here, '..', '..'), path.join(here, '..', '..', '..', '_night', 'tools'), process.cwd()];
  for (const c of candidates) {
    try {
      return createRequire(path.join(c, 'package.json'))('playwright-core');
    } catch {
      /* next */
    }
  }
  throw new Error('playwright-core not found (npm i -D playwright-core in menu/)');
}

const favicon = apps.appIconSvg(appId, { size: 64 });
fs.writeFileSync(path.join(outDir, 'favicon.svg'), favicon);

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(file, px, svg, transparent) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : '#fff'}">${svg.replace(/width="\d+" height="\d+"/, `width="${px}" height="${px}"`)}</body></html>`);
  await page.screenshot({ path: path.join(outDir, file), omitBackground: transparent, clip: { x: 0, y: 0, width: px, height: px } });
  console.log('✓', path.join(outDir, file));
}
await render('pwa-192.png', 192, apps.appIconSvg(appId), true);
await render('pwa-512.png', 512, apps.appIconSvg(appId), true);
await render('pwa-maskable-512.png', 512, apps.appIconSvg(appId, { maskable: true }), false);
await render('apple-touch-icon.png', 180, apps.appIconSvg(appId, { maskable: true }), false);
await browser.close();
console.log('✓', path.join(outDir, 'favicon.svg'));

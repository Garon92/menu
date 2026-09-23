# g92 kit

Shared design system + runtime helpers for every app on garon92.github.io.
Canonical source: **`menu/kit/`** (this folder). Apps get a vendored copy in `src/kit/` via `sync.sh`
— never edit the copy. Style guide with every token/component (light + dark): **`/menu/kit.html`**.

- Version: see `version.ts` (`KIT_VERSION`). Minor versions are additive; v0 API never breaks.
- Changelog: `~/AI/garon92-pages/_night/kit-changelog.md`. Requests: `_night/kit-requests.md`.

## Install / update in an app

```bash
bash ~/AI/garon92-pages/menu/kit/sync.sh tanky        # or several apps, or --all
```

Copies into `<app>/src/kit/` (with `--delete`), writes `src/kit/VENDORED.md`. React apps (package.json has
`"react"`) also get `src/kit/react/jsx.d.ts` (TSX typings for `<g92-appbar>`). Commit the copy.

## Files

| file | what |
|---|---|
| `kit.css` | single CSS entry = `fonts.css` + `tokens.css` + `base.css` |
| `tokens.css` | CSS custom properties (colors light/dark, type, spacing, radii, shadows, motion, z-index) |
| `base.css` | reset + components (`.g92-btn`, `.g92-card`, …) in cascade layers `base`, `components` |
| `tailwind-theme.css` | Tailwind v4 `@theme inline` bridge (`bg-surface`, `text-accent`, `rounded-lg`, `dark:` …) |
| `index.ts` | barrel: everything below |
| `apps.ts` | registry of the 9 apps (name, tagline, accent, icon, path) |
| `settings.ts` | global settings `g92:settings` (sound, volume, theme, reducedMotion, playerName) |
| `store.ts` | `createStore()` — namespaced, versioned app storage with migrations |
| `activity.ts` | `recordActivity()` — "last played / best score / progress" for the menu |
| `sfx.ts` | WebAudio synthesized sounds |
| `appbar.ts` | `<g92-appbar>` web component |
| `dialog.ts` | modal dialogs, confirm/alert, settings dialog |
| `toast.ts` | toasts |
| `dom.ts` | `h()` hyperscript, `starsHTML()`, `plural()`, `flash()`, `UI_ICONS` |
| `overlay.ts` | game screens: `showStart`, `showPause`, `showResults`, `countdown`, `autoPause` (v0.2) |
| `confetti.ts` | `confetti()`, `confettiFrom(el)` — canvas, reduced-motion aware (v0.2) |
| `pwa.ts` | `g92Pwa(appId)` → options for `VitePWA()`; DOM-free, import it in vite.config (v0.2) |
| `cz.ts` | `vocative('Adámek')` → „Adámku“, `greeting(name)`, `plural`, `countLabel` (v0.3) |
| `scripts/pwa-icons.mjs` | generates favicon.svg + PWA PNGs from the registry (not vendored) |

## Vanilla TS (games, menu)

```html
<!-- index.html -->
<html lang="cs">
<body class="g92-app">
  <g92-appbar app="tanky" fullscreen help></g92-appbar>
  <main class="g92-main">…</main>
  <script type="module" src="/src/main.ts"></script>
</body>
```

```ts
// src/main.ts
import './kit/kit.css';            // once, BEFORE your own CSS
import './style.css';
import { createStore, recordActivity, sfx, toast, openDialog, UI_ICONS } from './kit';

const store = createStore('tanky', {
  version: 1,
  defaults: { best: 0, difficulty: 'normal' as 'easy' | 'normal' | 'hard' },
  migrate(from, m) {
    if (from < 1) m.adopt('tanky_highscore', 'best', Number); // old key → new, old key removed
  },
});

document.querySelector('g92-appbar')!.addEventListener('g92-help', () =>
  openDialog({ title: 'Jak hrát', content: '<p>…</p>', actions: [{ label: 'Rozumím' }] }));

function gameOver(score: number) {
  const { best, isNewBest } = store.submitBest('best', score);
  recordActivity('tanky', { metric: { label: 'Rekord', value: best } });
  if (isNewBest) { sfx.win(); toast('Nový rekord!', { variant: 'success', icon: UI_ICONS.trophy }); }
  else sfx.lose();
}
```

`<g92-appbar>` sets `--accent` on `:root` from the registry and records "last opened" for the menu
automatically — you only report metrics.

## React 19 + Tailwind 4 (učící aplikace)

```ts
// src/main.tsx
import './kit/kit.css';     // first
import './index.css';
import './kit';             // registers <g92-appbar>, applies theme
```

```css
/* src/index.css */
@import "tailwindcss";
@import "./kit/tailwind-theme.css";
```

```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  const [help, setHelp] = useState(false);
  return (
    <div className="g92-app">
      <g92-appbar app="anglictina" help ong92-help={() => setHelp(true)} />
      <main className="g92-main">{children}</main>
    </div>
  );
}
// Tailwind utilities from the kit: bg-surface bg-surface-2 text-fg text-muted border-border
// bg-accent text-accent-contrast bg-accent-soft text-accent-text text-success bg-danger-soft
// rounded-md/lg/xl shadow-1..4 font-sans ease-spring text-display; dark: follows the kit theme.
```

TSX typing for `<g92-appbar>` comes from `src/kit/react/jsx.d.ts` (auto-included via `"include": ["src"]`).
React 19 passes `on<event>` props on custom elements as listeners → `ong92-help`, `ong92-settings`.
Settings in React:

```tsx
import { useSyncExternalStore } from 'react';
import { settings } from './kit';
export const useSettings = () => useSyncExternalStore(settings.subscribe, settings.snapshot); // stable frozen snapshot
```

## Tokens (CSS)

Every token is `--g92-*` except the accent family. Set **one** colour per app, everything derives:

| token | use |
|---|---|
| `--accent` | brand colour (appbar sets it from apps.ts) |
| `--accent-strong` / `--accent-soft` / `--accent-softer` | darker / tinted backgrounds |
| `--accent-text` | accent-coloured text with good contrast |
| `--accent-contrast` | text/icon colour ON an accent background (auto black/white) |
| `--accent-border`, `--accent-ring`, `--accent-glow` | borders, rings, glows |
| `--g92-bg`, `--g92-surface`, `--g92-surface-2/3`, `--g92-surface-glass` | surfaces |
| `--g92-text`, `--g92-text-muted`, `--g92-text-subtle`, `--g92-border(-strong)` | text & lines |
| `--g92-success/warning/danger/info` (+ `-soft`) | status |
| `--g92-gold` | stars, medals |
| `--g92-fs-xs…4xl`, `--g92-fs-display`, `--g92-fw-*` | type |
| `--g92-space-1…16`, `--g92-gutter`, `--g92-container` | spacing |
| `--g92-radius-xs…2xl`, `--g92-radius-pill` | radii (14–24 is the family look) |
| `--g92-shadow-1…4` | elevation |
| `--g92-dur-1…5`, `--g92-ease-out/in/in-out/spring`, `--g92-motion` (1 or 0) | motion (auto-reduced) |
| `--g92-z-appbar/overlay/dialog/toast/confetti` | layers |
| `--g92-touch` (44px), `--g92-touch-lg`, `--g92-touch-xl`, `--g92-appbar-h`, `--g92-appbar-total` | sizes |

A subtree can use its own accent: `<div class="g92-accent" style="--accent:#f59e0b">` (the class
recomputes the derived variables). Theme: `html[data-theme=light|dark]` (settings.ts sets it);
`html[data-scheme]` always holds the resolved scheme; `html[data-motion=reduce|full]`.

Full-height game area: `height: calc(100dvh - var(--g92-appbar-total));`

## Components (CSS classes)

- Layout: `.g92-app` (body/page shell with accent glow), `.g92-main` (+`--narrow`, `--full`),
  `.g92-container`, `.g92-stack`, `.g92-row`, `.g92-cluster`, `.g92-grid` (`--g92-min`, `--g92-gap`), `.g92-center`, `.g92-spacer`
- Buttons: `.g92-btn` (primary) `--secondary --soft --ghost --danger --success`, sizes `--sm --lg --xl`,
  `--icon --block --pill`; `aria-pressed="true"` for toggles. All ≥ 44 px.
- `.g92-card` (`--flat --accent --interactive`), `.g92-chip` (button/label chips; `aria-pressed`/checked input),
  `.g92-badge` (`--success --warning --danger --neutral --solid`)
- Forms: `.g92-field`, `.g92-label`, `.g92-hint`, `.g92-input` (`--xl` for big answer boxes, `.is-error/.is-success`),
  `.g92-select`, `.g92-textarea`, `input.g92-toggle` (switch), `.g92-switch-row`, `.g92-segmented` (radio labels
  or buttons with `aria-pressed`), `input.g92-range` (+ `bindRange(el)` for the WebKit fill)
- `.g92-progress` with `style="--value:.4"` (`--sm --lg --success`)
- Stars: `starsHTML(2, 3, 'g92-stars--lg g92-stars--animate')`
- `.g92-icon-tile` (`--solid`), `.g92-kbd`, `.g92-empty`, `.g92-spinner`, `.g92-divider`, `.g92-eyebrow`, `.g92-muted`,
  `.g92-sr-only`, `.g92-tabular`, `.g92-no-touch-scroll` (game canvases)
- Feedback animations: `flash(el, 'g92-anim-shake' | 'g92-anim-pop')`, `.g92-anim-float-in`

## JS API

### settings
```ts
settings.get()                // { sound, volume 0..1, theme 'auto'|'light'|'dark', reducedMotion 'auto'|'on'|'off', playerName }
settings.set({ sound: false })
const off = settings.subscribe((s, prev) => …)   // same tab + other tabs + OS theme/motion changes
prefersReducedMotion(); resolvedTheme();
openSettingsDialog({ extra?: Node })  // appbar's ⚙ does this; `extra` adds app-specific settings
```

### store
```ts
const store = createStore(appId, { version, defaults, migrate? });
store.get(k) / set(k, v) / update(k, fn) / patch({..}) / all() / reset(k?) / subscribe((k, v) => …)
store.submitBest('best', score)                         // higher wins → { best, isNewBest }
store.submitBest('bestTime', ms, { lowerIsBetter: true })
// migrate(fromVersion, m): m.legacy(k) m.legacyJSON(k) m.adopt(legacyKey, key, transform?) m.removeLegacy(k) m.get/set
```
Keys: `g92:<appId>:<key>` (JSON). Private mode / blocked storage → in-memory fallback, never throws.

### activity (menu stats)
```ts
recordActivity('matematika', { progress: 0.45, metric: { label: 'Příkladů', value: 312 }, note: 'Násobilka 7' });
recordActivity('tanky', { metric: { label: 'Rekord', value: 1200 } });   // after each game
getActivity() / getActivity(id) / recentApps(4) / subscribeActivity(fn) / timeAgo(ts) / formatMetric(v)
```
Pass `null` to clear a field. The appbar already records "last opened".

### sfx
```ts
sfx.tap() click() pop() flip() success() error() coin() levelUp() win() lose() whoosh() countdown() countdown(true) go()
sfx.play('coin'); sfx.tone({ freq: 440, to: 880, dur: .2, type: 'triangle' });
```
Unlocks on first gesture, respects settings (sound + volume). No files.

### dialog / toast
```ts
const d = openDialog({ title, content: '<p>…</p>' | Node, icon?: UI_ICONS.help, actions: [{ label: 'OK', value: 'ok', variant: 'primary' }], dismissible?, wide? });
await d.closed;  // action value or undefined
await confirmDialog({ title: 'Začít znovu?', message: '…', confirmLabel: 'Ano', danger: true }) // boolean
await alertDialog({ title: 'Hotovo' });
toast('Uloženo', { variant: 'success' | 'danger' | 'accent', icon, duration });
```

### appbar
```html
<g92-appbar app="ryby" fullscreen="#stage" help heading="Ryby – album" back="/menu/" transparent>
  <button slot="actions" class="g92-btn g92-btn--ghost g92-btn--icon" aria-label="Pauza">…</button>
</g92-appbar>
```
Attributes: `app` (required), `heading`, `back` (`none` hides), `back-label`, `fullscreen[=selector]`, `help`,
`no-sound`, `no-settings`, `no-accent`, `no-activity`, `no-theme-color`, `transparent`.
Slots: `actions`, `title`, `start`. Events: `g92-help`, `g92-settings` (cancelable), `g92-fullscreen`.
Height: `var(--g92-appbar-h)` = 60 px (+ safe-area).

### registry
```ts
import { APPS, getApp, ICONS } from './kit';
getApp('tanky')  // { id, name, tagline, description, category, accent, icon, path, metricLabel }
```

### dom helpers
`h('button', { class: 'g92-btn', onclick }, 'Hrát')`, `starsHTML(n, max)`, `plural(n, 'bod', 'body', 'bodů')`,
`flash(el, 'g92-anim-shake')`, `bindRange(input)`, `UI_ICONS.{back,home,soundOn,soundOff,fullscreen,settings,help,close,play,pause,restart,check,cross,trophy,sparkle,sun,moon,user,flame,clock,star,…}`.

### overlays (games) — v0.2
```ts
import { showStart, showPause, showResults, countdown, autoPause } from './kit';

const { difficulty } = await showStart({
  appId: 'komari',                                   // title/tagline/icon from the registry
  difficulties: [{ id: 'easy', label: 'Lehká', icon: '🐢' }, { id: 'normal', label: 'Střední', icon: '🐇' }, { id: 'hard', label: 'Těžká', icon: '🔥' }],
  difficulty: store.get('difficulty'),
  best: { label: 'Rekord', value: store.get('best') }, // hidden when 0
  howTo: [{ icon: '👆', text: 'Klepni na komára' }, { icon: '⏱️', text: 'Stihni to včas' }],   // pictograms, kids don't read
  keys: [{ keys: ['Mezerník'], text: 'pauza' }],
});
await countdown();                                   // 3-2-1-Start! with beeps

let pauseOverlay: ReturnType<typeof showPause> | null = null;
async function pause() {
  if (pauseOverlay) return;
  stopLoop();
  pauseOverlay = showPause();                        // Esc / P resume; "Znovu"; "Menu" → /menu/
  const choice = await pauseOverlay;                 // 'resume' | 'restart' | 'menu'
  pauseOverlay = null;
  if (choice === 'resume') startLoop(); else if (choice === 'restart') restart();
}
autoPause(pause);                                    // tab hidden / window blur

const { best, isNewBest } = store.submitBest('best', score);
recordActivity('komari', { metric: { label: 'Rekord', value: best } });
const next = await showResults({ score, best, isNewBest, stars: 2, stats: [{ label: 'Přesnost', value: '92 %' }] });
// 'again' | 'menu' | custom action value; plays win/lose sound + confetti (new best / top stars)
```
Options shared by all: `container` (mount inside a positioned element), `backdrop: 'blur'|'solid'|'clear'`,
`coverAppbar`, `extra: Node`. `menuHref: null` makes "Menu" resolve `'menu'` instead of navigating to `/menu/`.
Each call returns a Promise with `.el` and `.close(value)`.

### confetti
`confetti({ particleCount, origin: {x, y}, spread, cannons })`, `confettiFrom(el)`, `clearConfetti()` — returns false (no-op) with reduced motion.

### PWA
```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';
import { g92Pwa } from './src/kit/pwa';
export default defineConfig({ base: '/tanky/', plugins: [VitePWA(g92Pwa('tanky'))] });
// multi-page app: g92Pwa('cestina', { noNavigateFallback: true }); big assets: { maxFileSizeMB: 10, globPatterns: [...] }
```
Icons into `public/`: `node --experimental-strip-types ~/AI/garon92-pages/menu/kit/scripts/pwa-icons.mjs tanky public`
(favicon.svg, pwa-192.png, pwa-512.png, pwa-maskable-512.png, apple-touch-icon.png). In `index.html`:
```html
<link rel="icon" href="/tanky/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/tanky/apple-touch-icon.png">
<meta name="theme-color" content="#ef5350">
```
Needs `vite-plugin-pwa` in devDependencies; tsconfig for vite.config must include `src/kit/pwa.ts` + `src/kit/apps.ts` (both DOM-free).

### Czech helpers
`greeting('Adámek')` → „Dobré odpoledne, Adámku!“, `vocative(name)`, `plural(n, 'bod', 'body', 'bodů')`,
`countLabel(1200, 'bod', 'body', 'bodů')` → „1 200 bodů“, `timeAgo(ts)` / `timeAgoShort(ts)`.

### Page transitions
`base.css` enables cross-document View Transitions (`@view-transition { navigation: auto }`) — menu ↔ app
navigation cross-fades in supporting browsers; `<g92-appbar>` has `view-transition-name: g92-appbar`.

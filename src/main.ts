import '../kit/kit.css';
import './menu.css';
import {
  APPS,
  UI_ICONS,
  countLabel,
  createStore,
  getActivity,
  getSettings,
  greeting,
  metricText,
  openSettingsDialog,
  plural,
  prefersReducedMotion,
  recentApps,
  safeStorage,
  setSettings,
  setSettingsSection,
  sfx,
  subscribeActivity,
  subscribeSettings,
  timeAgoShort,
  toast,
  type ActivityEntry,
  type G92App,
} from '../kit';
import { buildBackground } from './background';
import { appsUsedToday, dailyByApp, type AppDaily } from './daily';
import { escapeHTML, pickDaily } from './util';
import { installPrompt } from './install';
import { settingsExtra } from './settings-extra';

const main = document.getElementById('main') as HTMLElement;

const SUBLINES = [
  'Na co máš dneska chuť?',
  'Hra, nebo trocha učení?',
  'Vyber si, do čeho se pustíš.',
  'Kam se vydáme tentokrát?',
  'Dneska to bude skvělé.',
];

const CATEGORY_META = {
  learn: {
    title: 'Učení',
    desc: 'Procvičuj a sbírej hvězdičky',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" fill="currentColor" fill-opacity=".2"/><path d="M6 11.2v4.6c0 1.5 2.7 3.2 6 3.2s6-1.7 6-3.2v-4.6M21.5 9v5.5"/></svg>`,
  },
  play: {
    title: 'Hry',
    desc: 'Zábava na chvilku i na dlouho',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 6.5h9a5 5 0 0 1 5 5v1.8a3.7 3.7 0 0 1-6.6 2.3l-.9-1.1h-4l-.9 1.1a3.7 3.7 0 0 1-6.6-2.3v-1.8a5 5 0 0 1 5-5Z" fill="currentColor" fill-opacity=".2"/><path d="M8 10v3M6.5 11.5h3"/><circle cx="15.5" cy="10.6" r=".6" fill="currentColor"/><circle cx="17.2" cy="12.6" r=".6" fill="currentColor"/></svg>`,
  },
} as const;

const dateFmt = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const menuStore = createStore('menu', { version: 1, defaults: { welcomeDismissed: false } });

/** Has this app's service worker been active at least once (kit appbar writes g92:<app>:offline)? */
function offlineReady(id: string): boolean {
  return safeStorage.getItem(`g92:${id}:offline`) !== null;
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function dailyText(d: AppDaily): string {
  if (d.done) return 'Dnešní cíl splněn';
  const unit = d.unit ? ` ${plural(d.goal, d.unit[0], d.unit[1], d.unit[2])}` : '';
  return `Dnes ${d.today} z ${d.goal}${unit}`;
}

function metaHTML(app: G92App, e: ActivityEntry | undefined, daily: AppDaily | undefined): string {
  const parts: string[] = [];
  if (isOffline() && !offlineReady(app.id)) {
    parts.push(`<span class="stat stat--offline">${UI_ICONS.cross}<span>Potřebuje internet</span></span>`);
  }
  if (e?.progress !== undefined) {
    const pct = Math.round(e.progress * 100);
    parts.push(
      `<span class="stat stat--progress" title="Hotovo ${pct} %"><span class="g92-progress g92-progress--sm" style="--value:${e.progress}"></span><b>${pct}&nbsp;%</b></span>`,
    );
  }
  if (daily) {
    parts.push(`<span class="stat stat--daily${daily.done ? ' is-done' : ''}">${daily.done ? UI_ICONS.check : UI_ICONS.clock}<span>${escapeHTML(dailyText(daily))}</span></span>`);
    if (daily.streak > 1) parts.push(`<span class="stat stat--streak">${UI_ICONS.flame}<span>${escapeHTML(countLabel(daily.streak, 'den', 'dny', 'dní'))} v řadě</span></span>`);
  }
  if (e?.metric) parts.push(`<span class="stat">${UI_ICONS.trophy}<span>${escapeHTML(metricText(e.metric))}</span></span>`);
  else if (e?.note) parts.push(`<span class="stat">${UI_ICONS.sparkle}<span>${escapeHTML(e.note)}</span></span>`);
  if (e) parts.push(`<span class="stat stat--time" data-ts="${e.lastOpened}">${UI_ICONS.clock}<span>${timeAgoShort(e.lastOpened)}</span></span>`);
  else parts.push(`<span class="stat stat--new">${UI_ICONS.sparkle}<span>Vyzkoušej!</span></span>`);
  return parts.join('');
}

function ariaFor(app: G92App, e: ActivityEntry | undefined, daily: AppDaily | undefined): string {
  const bits = [`${app.name} – ${app.tagline}`];
  if (e?.metric) bits.push(metricText(e.metric));
  if (e?.progress !== undefined) bits.push(`hotovo ${Math.round(e.progress * 100)} %`);
  if (daily) bits.push(dailyText(daily));
  if (e) bits.push(`naposledy ${timeAgoShort(e.lastOpened)}`);
  if (isOffline() && !offlineReady(app.id)) bits.push('potřebuje internet');
  return bits.join(', ');
}

function cardHTML(app: G92App, e: ActivityEntry | undefined, daily: AppDaily | undefined, i: number): string {
  const tags = (app.tags ?? []).map((t) => `<span class="g92-badge app-card__tag">${escapeHTML(t)}</span>`).join('');
  const offline = isOffline() && !offlineReady(app.id);
  return `<a class="app-card g92-accent${offline ? ' is-offline' : ''}" href="${app.path}" style="--accent:${app.accent};--i:${i}" data-app="${app.id}" aria-label="${escapeHTML(ariaFor(app, e, daily))}">
  <span class="app-card__art" aria-hidden="true">
    <span class="app-card__blob b1"></span><span class="app-card__blob b2"></span>
    <span class="app-card__icon">${app.icon}</span>
  </span>
  <span class="app-card__body">
    <span class="app-card__title"><span>${escapeHTML(app.name)}</span>${tags}</span>
    <span class="app-card__tagline">${escapeHTML(app.tagline)}</span>
    <span class="app-card__desc">${escapeHTML(app.description)}</span>
    <span class="app-card__meta">${metaHTML(app, e, daily)}</span>
  </span>
  <span class="app-card__go" aria-hidden="true">${UI_ICONS.arrowRight}</span>
</a>`;
}

/** "Pokračovat": WHERE to continue first (note / deep link), the statistic second. */
function resumeHTML(app: G92App, e: ActivityEntry, i: number): string {
  const lines: string[] = [];
  if (e.note) lines.push(escapeHTML(e.note));
  if (e.metric) lines.push(escapeHTML(metricText(e.metric)));
  if (!lines.length && e.progress !== undefined) lines.push(`Hotovo ${Math.round(e.progress * 100)}&nbsp;%`);
  if (!lines.length) lines.push(escapeHTML(app.tagline));
  const detail = lines.slice(0, 2).join(' · ');
  const href = e.href && e.href.startsWith(app.path) ? e.href : app.path;
  const label = `Pokračovat: ${app.name}${e.note ? `, ${e.note}` : ''}, ${timeAgoShort(e.lastOpened)}`;
  const offline = isOffline() && !offlineReady(app.id);
  return `<a class="resume-card g92-accent${offline ? ' is-offline' : ''}" href="${escapeHTML(href)}" style="--accent:${app.accent};--i:${i}" data-app="${app.id}" aria-label="${escapeHTML(label)}">
  <span class="resume-card__icon" aria-hidden="true">${app.icon}</span>
  <span class="resume-card__text">
    <span class="resume-card__name">${escapeHTML(app.name)}</span>
    <span class="resume-card__detail">${detail}</span>
    <span class="resume-card__foot">${e.progress !== undefined ? `<span class="g92-progress g92-progress--sm" style="--value:${e.progress}"></span>` : ''}<span class="resume-card__when" data-ts-short="${e.lastOpened}">${timeAgoShort(e.lastOpened)}</span></span>
  </span>
  <span class="resume-card__play" aria-hidden="true">${UI_ICONS.play}</span>
</a>`;
}

function heroHTML(): string {
  // family default name only; nobody set → neutral greeting
  const g = greeting(getSettings().playerName);
  const sub = pickDaily(SUBLINES);
  const used = appsUsedToday();
  const chips: string[] = [];
  if (used > 0) chips.push(`<span class="hero-chip">${UI_ICONS.check}<span>Dnes: <b>${escapeHTML(countLabel(used, 'aplikace', 'aplikace', 'aplikací'))}</b></span></span>`);
  return `<header class="hero">
  <p class="hero__date">${escapeHTML(dateFmt.format(new Date()))}</p>
  <h1 class="hero__title">${escapeHTML(g)} <span class="hero__wave" aria-hidden="true">👋</span></h1>
  <p class="hero__sub">${escapeHTML(sub)}</p>
  ${chips.length ? `<div class="hero__chips">${chips.join('')}</div>` : ''}
</header>`;
}

function welcomeHTML(hasName: boolean): string {
  return `<section class="welcome" aria-labelledby="welcome-title">
  <div class="welcome__art" aria-hidden="true">
    ${APPS.filter((a) => a.id !== 'menu')
      .slice(0, 5)
      .map((a, i) => `<span class="welcome__bubble" style="--accent:${a.accent};--i:${i}">${a.icon}</span>`)
      .join('')}
  </div>
  <div class="welcome__text">
    <h2 id="welcome-title">Vítej!</h2>
    <p>Tady najdeš všechny hry a cvičení. Klepni na kartičku a pusť se do toho — co rozehraješ, objeví se tady, ať můžeš hned pokračovat.</p>
    ${
      hasName
        ? ''
        : `<form class="welcome__form" novalidate>
      <label class="g92-label" for="welcome-name">Jak ti máme říkat?</label>
      <div class="welcome__row">
        <input class="g92-input" id="welcome-name" name="name" maxlength="40" autocomplete="nickname" placeholder="Tvoje jméno" aria-describedby="welcome-hint" />
        <button class="g92-btn" type="submit">${UI_ICONS.check}Uložit</button>
      </div>
      <div class="welcome__foot">
        <p class="g92-hint" id="welcome-hint">Jméno uvidíš v pozdravu. Můžeš ho kdykoli změnit v Nastavení.</p>
        <button class="g92-btn g92-btn--ghost g92-btn--sm" type="button" data-action="skip-name">Přeskočit</button>
      </div>
    </form>`
    }
  </div>
</section>`;
}

let rendered = false;
let lastSignature = '';

function signature(): string {
  return JSON.stringify([getActivity(), getSettings().playerName, dailyByApp(), isOffline(), menuStore.get('welcomeDismissed')]);
}

/** Re-render only when the data behind the page changed (keeps focus/scroll, no replayed animations). */
function renderIfChanged(): void {
  if (signature() !== lastSignature) render();
  else refreshTimes();
}

function render(): void {
  lastSignature = signature();
  if (rendered) main.classList.add('is-settled');
  rendered = true;
  const activity = getActivity();
  const daily = dailyByApp();
  const recent = recentApps(8).filter(({ id }) => id !== 'menu' && APPS.some((a) => a.id === id)).slice(0, 3);
  const s = getSettings();

  const sections: string[] = [heroHTML()];
  if (isOffline()) {
    sections.push(`<p class="offline-note" role="status">${UI_ICONS.cross}<span>Jsi offline. Fungují aplikace, které už byly jednou otevřené.</span></p>`);
  }
  if (recent.length) {
    sections.push(`<section class="continue" aria-labelledby="continue-title">
  <div class="section-head"><h2 id="continue-title" class="section-title">${UI_ICONS.play}<span>Pokračovat</span></h2></div>
  <div class="continue__list">${recent.map(({ id, entry }, i) => resumeHTML(APPS.find((a) => a.id === id)!, entry, i)).join('')}</div>
</section>`);
  } else {
    // first run: welcome card; the name form only until a name is saved or skipped
    sections.push(welcomeHTML(Boolean(s.playerName) || menuStore.get('welcomeDismissed')));
  }

  (['learn', 'play'] as const).forEach((cat, ci) => {
    const apps = APPS.filter((a) => a.category === cat);
    const meta = CATEGORY_META[cat];
    sections.push(`<section class="category" aria-labelledby="cat-${cat}" style="--ci:${ci}">
  <div class="section-head">
    <h2 id="cat-${cat}" class="section-title">${meta.icon}<span>${meta.title}</span><span class="section-count">${apps.length}</span></h2>
    <p class="section-desc">${meta.desc}</p>
  </div>
  <div class="app-grid">${apps.map((a, i) => cardHTML(a, activity[a.id], daily[a.id], i + ci * 3)).join('')}</div>
</section>`);
  });

  sections.push(`<footer class="menu-footer">
  <div class="menu-footer__actions">
    <button class="g92-btn g92-btn--ghost g92-btn--sm" type="button" data-action="settings">${UI_ICONS.settings}Nastavení</button>
    <button class="g92-btn g92-btn--soft g92-btn--sm" type="button" data-action="install" hidden>${UI_ICONS.sparkle}Nainstalovat</button>
  </div>
  <p class="menu-footer__copy">© ${new Date().getFullYear()} Garon92 · ${escapeHTML(countLabel(APPS.length - 1, 'aplikace', 'aplikace', 'aplikací'))} pro celou rodinu</p>
</footer>`);

  main.innerHTML = sections.join('\n');
  markWide();
  wire();
}

/** Cards that fill a whole last row get the horizontal "wide" layout (CSS decides the span). */
function markWide(): void {
  for (const card of main.querySelectorAll<HTMLElement>('.app-card')) {
    const grid = card.parentElement as HTMLElement;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const cs = getComputedStyle(card);
    const span = `${cs.gridColumnStart} ${cs.gridColumnEnd}`;
    card.classList.toggle('is-wide', cols > 1 && /span\s*[23]/.test(span));
  }
}

let resizeRaf = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(markWide);
});

function refreshTimes(): void {
  for (const el of main.querySelectorAll<HTMLElement>('[data-ts]')) {
    const ts = Number(el.dataset.ts);
    const target = el.querySelector('span') ?? el;
    target.textContent = timeAgoShort(ts);
  }
  for (const el of main.querySelectorAll<HTMLElement>('[data-ts-short]')) el.textContent = timeAgoShort(Number(el.dataset.tsShort));
  const hero = main.querySelector('.hero__title');
  // greeting depends on the time of day
  if (hero && !hero.textContent?.startsWith(greeting(getSettings().playerName))) replaceHero();
}

// ---------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------

function wire(): void {
  main.querySelector<HTMLButtonElement>('[data-action="settings"]')?.addEventListener('click', () => {
    sfx.tap();
    openSettingsDialog({ appId: 'menu' });
  });

  const form = main.querySelector<HTMLFormElement>('.welcome__form');
  if (form) {
    const input = form.querySelector('input') as HTMLInputElement;
    const hint = form.querySelector('#welcome-hint') as HTMLElement;
    const hintText = hint.textContent ?? '';
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true' && input.value.trim()) {
        input.removeAttribute('aria-invalid');
        input.classList.remove('is-error');
        hint.classList.remove('is-error');
        hint.textContent = hintText;
      }
    });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = input.value.trim();
      if (!name) {
        input.focus();
        input.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
        hint.classList.add('is-error');
        hint.textContent = 'Napiš jméno, nebo klepni na Přeskočit.';
        sfx.error();
        return;
      }
      setSettings({ playerName: name });
      menuStore.set('welcomeDismissed', true);
      sfx.success();
      toast(`Ahoj! Budeme ti říkat ${name}.`, { variant: 'accent', icon: UI_ICONS.sparkle });
    });
    form.querySelector('[data-action="skip-name"]')?.addEventListener('click', () => {
      sfx.tap();
      menuStore.set('welcomeDismissed', true);
      form.remove();
      lastSignature = signature();
    });
  }

  installPrompt.bind(main.querySelector<HTMLButtonElement>('[data-action="install"]'));

  // press feedback + view-transition naming for the clicked app icon
  for (const a of main.querySelectorAll<HTMLAnchorElement>('a.app-card, a.resume-card')) {
    a.addEventListener('click', (ev) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const id = a.dataset.app ?? '';
      // offline + never opened → the browser would show its own error page; explain instead
      if (isOffline() && !offlineReady(id)) {
        ev.preventDefault();
        sfx.error();
        const name = APPS.find((x) => x.id === id)?.name ?? 'Aplikace';
        toast(`Aplikace ${name} se ještě nestihla stáhnout. Připoj se k internetu a zkus to znovu.`, { variant: 'danger', icon: UI_ICONS.cross, duration: 4500 });
        return;
      }
      sfx.tap();
      a.classList.add('is-launching');
    });
  }
}

// App settings sync (name change → greeting), activity from other tabs, relative times.
function replaceHero(): void {
  const hero = main.querySelector('.hero');
  if (!hero) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = heroHTML();
  const next = tmp.firstElementChild as HTMLElement;
  next.style.animation = 'none';
  hero.replaceWith(next);
}

let lastName = getSettings().playerName;
subscribeSettings((s) => {
  if (s.playerName !== lastName) {
    lastName = s.playerName;
    lastSignature = signature();
    replaceHero();
    // name added on the welcome screen → drop the form
    main.querySelector('.welcome__form')?.remove();
  }
});
subscribeActivity(() => renderIfChanged());
setInterval(refreshTimes, 60_000);
document.addEventListener('visibilitychange', () => {
  // returning from an app via tab switch: show fresh stats
  if (document.visibilityState === 'visible') renderIfChanged();
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    for (const el of main.querySelectorAll('.is-launching')) el.classList.remove('is-launching');
    renderIfChanged();
  }
});
window.addEventListener('online', () => renderIfChanged());
window.addEventListener('offline', () => renderIfChanged());

// ⚙ in the appbar and the footer button open the same kit dialog with the menu's section
setSettingsSection({ extra: () => settingsExtra(render), nameMode: 'family', showVoice: true });

render();
buildBackground(document.querySelector('.menu-bg') as HTMLElement, { animate: !prefersReducedMotion() });
subscribeSettings(() => document.querySelector('.menu-bg')?.classList.toggle('is-static', prefersReducedMotion()));

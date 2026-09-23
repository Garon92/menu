import '../kit/kit.css';
import './menu.css';
import {
  APPS,
  UI_ICONS,
  formatMetric,
  getActivity,
  getSettings,
  greeting,
  openSettingsDialog,
  prefersReducedMotion,
  recentApps,
  setSettings,
  sfx,
  subscribeActivity,
  subscribeSettings,
  timeAgo,
  timeAgoShort,
  toast,
  type ActivityEntry,
  type G92App,
} from '../kit';
import { buildBackground } from './background';
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

function metaHTML(app: G92App, e: ActivityEntry | undefined): string {
  const parts: string[] = [];
  if (e?.progress !== undefined) {
    const pct = Math.round(e.progress * 100);
    parts.push(
      `<span class="stat stat--progress" title="Hotovo ${pct} %"><span class="g92-progress g92-progress--sm" style="--value:${e.progress}"></span><b>${pct}&nbsp;%</b></span>`,
    );
  }
  if (e?.metric) {
    parts.push(`<span class="stat">${UI_ICONS.trophy}<span>${escapeHTML(e.metric.label)} <b>${escapeHTML(formatMetric(e.metric.value))}</b></span></span>`);
  }
  if (e?.note && !e.metric) parts.push(`<span class="stat">${UI_ICONS.sparkle}<span>${escapeHTML(e.note)}</span></span>`);
  if (e) parts.push(`<span class="stat stat--time" data-ts="${e.lastOpened}">${UI_ICONS.clock}<span>${timeAgo(e.lastOpened)}</span></span>`);
  else parts.push(`<span class="stat stat--new">${UI_ICONS.sparkle}<span>Vyzkoušej!</span></span>`);
  void app;
  return parts.join('');
}

function ariaFor(app: G92App, e: ActivityEntry | undefined): string {
  const bits = [`${app.name} – ${app.tagline}`];
  if (e?.metric) bits.push(`${e.metric.label} ${formatMetric(e.metric.value)}`);
  if (e?.progress !== undefined) bits.push(`hotovo ${Math.round(e.progress * 100)} %`);
  if (e) bits.push(`naposledy ${timeAgo(e.lastOpened)}`);
  return bits.join(', ');
}

function cardHTML(app: G92App, e: ActivityEntry | undefined, i: number): string {
  const tags = (app.tags ?? []).map((t) => `<span class="g92-badge app-card__tag">${escapeHTML(t)}</span>`).join('');
  return `<a class="app-card g92-accent" href="${app.path}" style="--accent:${app.accent};--i:${i}" data-app="${app.id}" aria-label="${escapeHTML(ariaFor(app, e))}">
  <span class="app-card__art" aria-hidden="true">
    <span class="app-card__blob b1"></span><span class="app-card__blob b2"></span>
    <span class="app-card__icon">${app.icon}</span>
  </span>
  <span class="app-card__body">
    <span class="app-card__title"><span>${escapeHTML(app.name)}</span>${tags}</span>
    <span class="app-card__tagline">${escapeHTML(app.tagline)}</span>
    <span class="app-card__meta">${metaHTML(app, e)}</span>
  </span>
  <span class="app-card__go" aria-hidden="true">${UI_ICONS.arrowRight}</span>
</a>`;
}

function resumeHTML(app: G92App, e: ActivityEntry, i: number): string {
  const detail = e.metric
    ? `${escapeHTML(e.metric.label)} <b>${escapeHTML(formatMetric(e.metric.value))}</b>`
    : e.note
      ? escapeHTML(e.note)
      : e.progress !== undefined
        ? `Hotovo <b>${Math.round(e.progress * 100)}&nbsp;%</b>`
        : escapeHTML(app.tagline);
  const label = `Pokračovat: ${app.name}, ${timeAgo(e.lastOpened)}`;
  return `<a class="resume-card g92-accent" href="${app.path}" style="--accent:${app.accent};--i:${i}" data-app="${app.id}" aria-label="${escapeHTML(label)}">
  <span class="resume-card__icon" aria-hidden="true">${app.icon}</span>
  <span class="resume-card__text">
    <span class="resume-card__name">${escapeHTML(app.name)}</span>
    <span class="resume-card__detail">${detail} <span class="resume-card__when" data-ts-short="${e.lastOpened}">· ${timeAgoShort(e.lastOpened)}</span></span>
    ${e.progress !== undefined ? `<span class="g92-progress g92-progress--sm" style="--value:${e.progress}"></span>` : ''}
  </span>
  <span class="resume-card__play" aria-hidden="true">${UI_ICONS.play}</span>
</a>`;
}

function heroHTML(): string {
  const s = getSettings();
  const g = greeting(s.playerName);
  const sub = pickDaily(SUBLINES);
  return `<header class="hero">
  <p class="hero__date">${escapeHTML(dateFmt.format(new Date()))}</p>
  <h1 class="hero__title">${escapeHTML(g)} <span class="hero__wave" aria-hidden="true">👋</span></h1>
  <p class="hero__sub">${escapeHTML(sub)}</p>
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
        <input class="g92-input" id="welcome-name" name="name" maxlength="40" autocomplete="nickname" placeholder="Tvoje jméno" />
        <button class="g92-btn" type="submit">${UI_ICONS.check}Uložit</button>
      </div>
    </form>`
    }
  </div>
</section>`;
}

let rendered = false;
let lastSignature = '';

function signature(): string {
  return JSON.stringify([getActivity(), getSettings().playerName]);
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
  const recent = recentApps(8).filter(({ id }) => id !== 'menu' && APPS.some((a) => a.id === id)).slice(0, 3);
  const s = getSettings();

  const sections: string[] = [heroHTML()];
  if (recent.length) {
    sections.push(`<section class="continue" aria-labelledby="continue-title">
  <div class="section-head"><h2 id="continue-title" class="section-title">${UI_ICONS.play}<span>Pokračovat</span></h2></div>
  <div class="continue__list">${recent.map(({ id, entry }, i) => resumeHTML(APPS.find((a) => a.id === id)!, entry, i)).join('')}</div>
</section>`);
  } else {
    sections.push(welcomeHTML(Boolean(s.playerName)));
  }

  (['learn', 'play'] as const).forEach((cat, ci) => {
    const apps = APPS.filter((a) => a.category === cat);
    const meta = CATEGORY_META[cat];
    sections.push(`<section class="category" aria-labelledby="cat-${cat}" style="--ci:${ci}">
  <div class="section-head">
    <h2 id="cat-${cat}" class="section-title">${meta.icon}<span>${meta.title}</span><span class="section-count">${apps.length}</span></h2>
    <p class="section-desc">${meta.desc}</p>
  </div>
  <div class="app-grid">${apps.map((a, i) => cardHTML(a, activity[a.id], i + ci * 3)).join('')}</div>
</section>`);
  });

  sections.push(`<footer class="menu-footer">
  <div class="menu-footer__actions">
    <button class="g92-btn g92-btn--ghost g92-btn--sm" type="button" data-action="settings">${UI_ICONS.settings}Nastavení</button>
    <button class="g92-btn g92-btn--soft g92-btn--sm" type="button" data-action="install" hidden>${UI_ICONS.sparkle}Nainstalovat</button>
    <a class="g92-btn g92-btn--ghost g92-btn--sm" href="./kit.html">${UI_ICONS.grid}Design kit</a>
  </div>
  <p class="menu-footer__copy">© ${new Date().getFullYear()} Garon92 · ${APPS.length - 1} aplikací pro celou rodinu</p>
</footer>`);

  main.innerHTML = sections.join('\n');
  wire();
}

function refreshTimes(): void {
  for (const el of main.querySelectorAll<HTMLElement>('[data-ts]')) {
    const ts = Number(el.dataset.ts);
    const target = el.querySelector('span') ?? el;
    target.textContent = timeAgo(ts);
  }
  for (const el of main.querySelectorAll<HTMLElement>('[data-ts-short]')) el.textContent = `· ${timeAgoShort(Number(el.dataset.tsShort))}`;
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
    openSettingsDialog({ extra: settingsExtra(render) });
  });

  const form = main.querySelector<HTMLFormElement>('.welcome__form');
  form?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = form.querySelector('input') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) {
      input.focus();
      input.classList.add('is-error');
      sfx.error();
      return;
    }
    setSettings({ playerName: name });
    sfx.success();
    toast(`Ahoj! Budeme ti říkat ${name}.`, { variant: 'accent', icon: UI_ICONS.sparkle });
  });

  installPrompt.bind(main.querySelector<HTMLButtonElement>('[data-action="install"]'));

  // press feedback + view-transition naming for the clicked app icon
  for (const a of main.querySelectorAll<HTMLAnchorElement>('a.app-card, a.resume-card')) {
    a.addEventListener('click', (ev) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
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
  if (e.persisted) renderIfChanged();
});

render();
buildBackground(document.querySelector('.menu-bg') as HTMLElement, { animate: !prefersReducedMotion() });
subscribeSettings(() => document.querySelector('.menu-bg')?.classList.toggle('is-static', prefersReducedMotion()));

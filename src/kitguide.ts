import '../kit/kit.css';
import './kitguide.css';
import {
  APPS,
  KIT_VERSION,
  UI_ICONS,
  alertDialog,
  applyAccent,
  bindRange,
  confetti,
  confirmDialog,
  countdown,
  flash,
  getSettings,
  openDialog,
  openSettingsDialog,
  setHelp,
  setSettings,
  sfx,
  showPause,
  showResults,
  showStart,
  starsHTML,
  subscribeSettings,
  toast,
  type SfxName,
  type ThemeSetting,
} from '../kit';
import { escapeHTML } from './util';

const root = document.getElementById('guide') as HTMLElement;

const sec = (id: string, title: string, desc: string, body: string) => `
<section class="kg-section" id="${id}" aria-labelledby="${id}-t">
  <header class="kg-section__head"><h2 id="${id}-t">${title}</h2><p>${desc}</p></header>
  ${body}
</section>`;

const swatch = (v: string, label = v) =>
  `<div class="kg-swatch"><span class="kg-swatch__chip" style="background:var(${v})"></span><code>${label}</code></div>`;

const SURFACES = ['--g92-bg', '--g92-bg-elevated', '--g92-surface', '--g92-surface-2', '--g92-surface-3', '--g92-surface-glass', '--g92-border', '--g92-border-strong'];
const TEXTS = ['--g92-text', '--g92-text-muted', '--g92-text-subtle', '--g92-text-inverse'];
const STATUS = ['--g92-success', '--g92-success-soft', '--g92-warning', '--g92-warning-soft', '--g92-danger', '--g92-danger-soft', '--g92-info', '--g92-info-soft', '--g92-gold'];
const ACCENTS = ['--accent', '--accent-strong', '--accent-soft', '--accent-softer', '--accent-border', '--accent-ring', '--accent-glow', '--accent-text', '--accent-contrast'];
const FS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'display'];
const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'pill'];
const SFX: SfxName[] = ['tap', 'click', 'pop', 'flip', 'success', 'error', 'coin', 'levelUp', 'win', 'lose', 'whoosh', 'countdown', 'go'];

function render(): void {
  const s = getSettings();
  const themeSeg = (['auto', 'light', 'dark'] as ThemeSetting[])
    .map((t) => `<label><input type="radio" name="kg-theme" value="${t}" ${s.theme === t ? 'checked' : ''}><span>${{ auto: UI_ICONS.auto + 'Auto', light: UI_ICONS.sun + 'Světlý', dark: UI_ICONS.moon + 'Tmavý' }[t]}</span></label>`)
    .join('');
  const accentChips = APPS.map(
    (a, i) =>
      `<button type="button" class="g92-chip kg-accent-chip" data-accent="${a.accent}" aria-pressed="${i === 0}" style="--dot:${a.accent}"><span class="kg-dot"></span>${escapeHTML(a.name)}</button>`,
  ).join('');

  root.innerHTML = `
<header class="kg-hero">
  <p class="g92-eyebrow">garon92 design systém · v${KIT_VERSION}</p>
  <h1>g92 kit</h1>
  <p class="kg-lead">Jeden vzhled pro všechny hry a cvičení: tokeny, komponenty, herní obrazovky, zvuky. Zdroj je v <code>menu/kit/</code>, do aplikací se kopíruje skriptem <code>sync.sh</code>.</p>
  <div class="kg-controls g92-card">
    <div class="g92-field"><span class="g92-label">Motiv</span><div class="g92-segmented" role="radiogroup" aria-label="Motiv">${themeSeg}</div></div>
    <div class="g92-field"><span class="g92-label">Accent aplikace</span><div class="g92-cluster" style="--g92-gap:6px">${accentChips}</div></div>
  </div>
  <nav class="kg-toc" aria-label="Obsah">
    ${[
      ['barvy', 'Barvy'],
      ['aplikace', 'Aplikace'],
      ['typografie', 'Typografie'],
      ['rozmery', 'Rozměry'],
      ['tlacitka', 'Tlačítka'],
      ['karty', 'Karty a štítky'],
      ['formulare', 'Formuláře'],
      ['stav', 'Postup a hvězdy'],
      ['ikony', 'Ikony'],
      ['dialogy', 'Dialogy'],
      ['hry', 'Herní obrazovky'],
      ['zvuky', 'Zvuky'],
    ]
      .map(([id, t]) => `<a class="g92-chip" href="#${id}">${t}</a>`)
      .join('')}
  </nav>
</header>

${sec(
  'barvy',
  'Barvy',
  'Neutrální plochy a text se přepínají se světlým/tmavým motivem. Aplikace nastavuje jedinou barvu <code>--accent</code>, ostatní se dopočítají.',
  `<h3 class="kg-sub">Accent</h3><div class="kg-swatches">${ACCENTS.map((v) => swatch(v)).join('')}</div>
   <h3 class="kg-sub">Plochy</h3><div class="kg-swatches">${SURFACES.map((v) => swatch(v)).join('')}</div>
   <h3 class="kg-sub">Text</h3><div class="kg-swatches">${TEXTS.map((v) => swatch(v)).join('')}</div>
   <h3 class="kg-sub">Stavy</h3><div class="kg-swatches">${STATUS.map((v) => swatch(v)).join('')}</div>`,
)}

${sec(
  'aplikace',
  'Aplikace',
  'Registr <code>apps.ts</code>: název, popisek, ikona a barva každé aplikace.',
  `<div class="kg-apps">${APPS.map(
    (a) => `<div class="kg-app g92-accent" style="--accent:${a.accent}">
      <span class="g92-icon-tile g92-icon-tile--solid">${a.icon}</span>
      <div><strong>${escapeHTML(a.name)}</strong><span class="g92-muted">${escapeHTML(a.tagline)}</span><code>${a.id} · ${a.accent} · ${a.category}</code></div>
    </div>`,
  ).join('')}</div>`,
)}

${sec(
  'typografie',
  'Typografie',
  'Nunito Variable (vlastní hosting, latin + latin-ext). Váhy 450 / 600 / 750 / 900.',
  `<div class="kg-type">${FS.map(
    (f) => `<div class="kg-type__row"><code>--g92-fs-${f}</code><span style="font-size:var(--g92-fs-${f});font-weight:${['xs', 'sm', 'md', 'lg'].includes(f) ? 600 : 900};line-height:1.15">Příliš žluťoučký kůň</span></div>`,
  ).join('')}</div>
  <div class="kg-prose g92-card g92-card--flat">
    <h1>Nadpis 1</h1><h2>Nadpis 2</h2><h3>Nadpis 3</h3><h4>Nadpis 4</h4>
    <p>Běžný odstavec s <a href="#typografie">odkazem</a>, <strong>tučným textem</strong> a klávesou <kbd class="g92-kbd">Enter</kbd>. Úžasně čeřené ďábelské ódy.</p>
    <p class="g92-muted">Tlumený text pro popisky a vysvětlivky.</p>
  </div>`,
)}

${sec(
  'rozmery',
  'Mezery, zaoblení, stíny',
  'Mřížka 4 px, zaoblení 14–24 px dává rodině hravý vzhled, stíny jsou měkké.',
  `<h3 class="kg-sub">Mezery</h3><div class="kg-space">${SPACE.map((n) => `<div><span style="width:var(--g92-space-${n})"></span><code>${n}</code></div>`).join('')}</div>
   <h3 class="kg-sub">Zaoblení</h3><div class="kg-radii">${RADII.map((r) => `<div style="border-radius:var(--g92-radius-${r})"><code>${r}</code></div>`).join('')}</div>
   <h3 class="kg-sub">Stíny</h3><div class="kg-shadows">${[1, 2, 3, 4].map((n) => `<div style="box-shadow:var(--g92-shadow-${n})"><code>shadow-${n}</code></div>`).join('')}</div>`,
)}

${sec(
  'tlacitka',
  'Tlačítka',
  'Všechna tlačítka mají aspoň 44 px. <code>--xl</code> je obří tlačítko pro děti.',
  `<div class="kg-demo g92-cluster">
    <button class="g92-btn">${UI_ICONS.play}Primární</button>
    <button class="g92-btn g92-btn--secondary">Sekundární</button>
    <button class="g92-btn g92-btn--soft">Jemné</button>
    <button class="g92-btn g92-btn--ghost">Průhledné</button>
    <button class="g92-btn g92-btn--success">${UI_ICONS.check}Správně</button>
    <button class="g92-btn g92-btn--danger">Smazat</button>
    <button class="g92-btn" disabled>Vypnuté</button>
  </div>
  <div class="kg-demo g92-cluster">
    <button class="g92-btn g92-btn--sm">Malé</button>
    <button class="g92-btn">Střední</button>
    <button class="g92-btn g92-btn--lg">Velké</button>
    <button class="g92-btn g92-btn--xl">${UI_ICONS.play}Hrát</button>
  </div>
  <div class="kg-demo g92-cluster">
    <button class="g92-btn g92-btn--icon" aria-label="Hrát">${UI_ICONS.play}</button>
    <button class="g92-btn g92-btn--secondary g92-btn--icon" aria-label="Pauza">${UI_ICONS.pause}</button>
    <button class="g92-btn g92-btn--ghost g92-btn--icon" aria-label="Znovu">${UI_ICONS.restart}</button>
    <button class="g92-btn g92-btn--soft g92-btn--icon g92-btn--pill" aria-label="Nápověda">${UI_ICONS.help}</button>
    <button class="g92-btn g92-btn--secondary" aria-pressed="true">Zapnuto (aria-pressed)</button>
  </div>
  <div class="kg-demo" style="max-width:24rem"><button class="g92-btn g92-btn--xl g92-btn--block">${UI_ICONS.play}Přes celou šířku</button></div>`,
)}

${sec(
  'karty',
  'Karty, čipy, štítky',
  'Karty nesou obsah, čipy slouží k výběru, štítky k označení stavu.',
  `<div class="g92-grid" style="--g92-min:14rem">
    <div class="g92-card"><h3>Karta</h3><p class="g92-muted">Výchozí plocha s jemným stínem.</p></div>
    <div class="g92-card g92-card--flat"><h3>Plochá</h3><p class="g92-muted">Bez stínu, na podklad.</p></div>
    <div class="g92-card g92-card--accent"><h3>Accent</h3><p class="g92-muted">Zvýrazněná barvou aplikace.</p></div>
    <a class="g92-card g92-card--interactive" href="#karty"><h3>Klikací</h3><p class="g92-muted">Při najetí se zvedne.</p></a>
  </div>
  <div class="kg-demo g92-cluster">
    <span class="g92-chip">${UI_ICONS.clock}Statický čip</span>
    <button class="g92-chip" aria-pressed="true" type="button">Vybraný</button>
    <button class="g92-chip" aria-pressed="false" type="button">Nevybraný</button>
    <label class="g92-chip"><input type="checkbox" checked>Checkbox čip</label>
  </div>
  <div class="kg-demo g92-cluster">
    <span class="g92-badge">Accent</span><span class="g92-badge g92-badge--solid">Nové</span><span class="g92-badge g92-badge--success">Hotovo</span>
    <span class="g92-badge g92-badge--warning">Pozor</span><span class="g92-badge g92-badge--danger">Chyba</span><span class="g92-badge g92-badge--neutral">Neutrální</span>
  </div>`,
)}

${sec(
  'formulare',
  'Formuláře',
  'Písmo v polích má aspoň 16 px, aby iOS nezoomoval. Fokus je vždy vidět.',
  `<div class="g92-grid" style="--g92-min:16rem">
    <div class="g92-field"><label class="g92-label" for="kg-in">Textové pole</label><input id="kg-in" class="g92-input" placeholder="Napiš něco…"><span class="g92-hint">Nápověda pod polem.</span></div>
    <div class="g92-field"><label class="g92-label" for="kg-err">Chybné pole</label><input id="kg-err" class="g92-input" aria-invalid="true" value="kočka"><span class="g92-hint" style="color:var(--g92-danger)">Zkus to ještě jednou.</span></div>
    <div class="g92-field"><label class="g92-label" for="kg-sel">Výběr</label><select id="kg-sel" class="g92-select"><option>Sčítání</option><option>Odčítání</option><option>Násobení</option></select></div>
    <div class="g92-field"><label class="g92-label" for="kg-xl">Velké pole pro odpověď</label><input id="kg-xl" class="g92-input g92-input--xl" inputmode="numeric" value="42"></div>
    <div class="g92-field"><label class="g92-label" for="kg-ta">Víceřádkové</label><textarea id="kg-ta" class="g92-textarea">Ahoj!</textarea></div>
    <div class="g92-field">
      <label class="g92-switch-row"><span class="g92-label">Přepínač</span><input type="checkbox" class="g92-toggle" role="switch" checked></label>
      <label class="g92-switch-row"><span class="g92-label">Vypnutý</span><input type="checkbox" class="g92-toggle" role="switch"></label>
    </div>
    <div class="g92-field"><span class="g92-label">Segmenty</span><div class="g92-segmented" role="radiogroup" aria-label="Obtížnost"><label><input type="radio" name="kg-seg" checked><span>Lehká</span></label><label><input type="radio" name="kg-seg"><span>Střední</span></label><label><input type="radio" name="kg-seg"><span>Těžká</span></label></div></div>
    <div class="g92-field"><label class="g92-label" for="kg-range">Posuvník</label><input id="kg-range" type="range" class="g92-range" min="0" max="100" value="60"></div>
  </div>`,
)}

${sec(
  'stav',
  'Postup, hvězdy a drobnosti',
  'Ukazatele postupu, hodnocení hvězdami, prázdný stav, načítání.',
  `<div class="g92-grid" style="--g92-min:16rem">
    <div class="g92-card g92-stack">
      <div class="g92-progress g92-progress--sm" style="--value:.25"></div>
      <div class="g92-progress" style="--value:.6"></div>
      <div class="g92-progress g92-progress--lg g92-progress--success" style="--value:.9"></div>
    </div>
    <div class="g92-card g92-stack" style="align-items:center">
      ${starsHTML(0)}${starsHTML(2)}${starsHTML(3, 3, 'g92-stars--lg g92-stars--animate')}
    </div>
    <div class="g92-card g92-empty">${UI_ICONS.sparkle}<strong>Zatím tu nic není</strong><span>Zahraj si a objeví se tu tvoje výsledky.</span></div>
    <div class="g92-card g92-stack" style="align-items:center;justify-content:center">
      <div class="g92-spinner" role="status" aria-label="Načítání"></div>
      <div class="g92-row"><span class="g92-icon-tile">${UI_ICONS.trophy}</span><span class="g92-icon-tile g92-icon-tile--solid">${UI_ICONS.flame}</span></div>
      <div class="g92-row"><kbd class="g92-kbd">←</kbd><kbd class="g92-kbd">→</kbd><kbd class="g92-kbd">Mezerník</kbd></div>
    </div>
  </div>
  <div class="kg-demo g92-cluster">
    <button class="g92-btn g92-btn--secondary" data-anim="g92-anim-shake">Zatřes (chyba)</button>
    <button class="g92-btn g92-btn--secondary" data-anim="g92-anim-pop">Poskoč (správně)</button>
  </div>`,
)}

${sec(
  'ikony',
  'UI ikony',
  '<code>UI_ICONS</code> z <code>dom.ts</code> — 24×24, barva podle textu.',
  `<div class="kg-icons">${Object.entries(UI_ICONS)
    .map(([k, v]) => `<div class="kg-icon">${v}<code>${k}</code></div>`)
    .join('')}</div>`,
)}

${sec(
  'dialogy',
  'Dialogy a oznámení',
  'Nativní <code>&lt;dialog&gt;</code> s pastí na fokus. Esc a klik mimo zavírají.',
  `<div class="kg-demo g92-cluster">
    <button class="g92-btn" data-demo="dialog">Dialog</button>
    <button class="g92-btn g92-btn--secondary" data-demo="confirm">Potvrzení</button>
    <button class="g92-btn g92-btn--secondary" data-demo="alert">Upozornění</button>
    <button class="g92-btn g92-btn--secondary" data-demo="settings">${UI_ICONS.settings}Nastavení</button>
  </div>
  <div class="kg-demo g92-cluster">
    <button class="g92-btn g92-btn--ghost" data-toast="default">Toast</button>
    <button class="g92-btn g92-btn--ghost" data-toast="success">Toast úspěch</button>
    <button class="g92-btn g92-btn--ghost" data-toast="danger">Toast chyba</button>
    <button class="g92-btn g92-btn--ghost" data-toast="accent">Toast accent</button>
    <button class="g92-btn g92-btn--ghost" data-toast="action">Toast s akcí</button>
  </div>`,
)}

${sec(
  'hry',
  'Herní obrazovky',
  '<code>overlay.ts</code>: úvod s obtížností a nápovědou v obrázcích, pauza, výsledky se skóre a hvězdami, odpočet, konfety.',
  `<div class="kg-demo g92-cluster">
    <button class="g92-btn" data-demo="start">${UI_ICONS.play}Úvodní obrazovka</button>
    <button class="g92-btn g92-btn--secondary" data-demo="pause">${UI_ICONS.pause}Pauza</button>
    <button class="g92-btn g92-btn--secondary" data-demo="results">${UI_ICONS.trophy}Výsledky (rekord)</button>
    <button class="g92-btn g92-btn--secondary" data-demo="results2">Výsledky (1 hvězda)</button>
    <button class="g92-btn g92-btn--secondary" data-demo="lost">Prohra</button>
    <button class="g92-btn g92-btn--secondary" data-demo="countdown">3-2-1</button>
    <button class="g92-btn g92-btn--soft" data-demo="confetti">${UI_ICONS.sparkle}Konfety</button>
  </div>`,
)}

${sec(
  'zvuky',
  'Zvuky',
  '<code>sfx.ts</code> — syntetizované přes WebAudio, bez souborů. Řídí se nastavením zvuku a hlasitosti.',
  `<div class="kg-demo g92-cluster">${SFX.map((n) => `<button class="g92-btn g92-btn--secondary g92-btn--sm" data-sfx="${n}">${UI_ICONS.soundOn}${n}</button>`).join('')}</div>`,
)}
<footer class="kg-foot g92-muted">g92 kit v${KIT_VERSION} · dokumentace v <code>menu/kit/README.md</code></footer>`;

  wire();
}

function wire(): void {
  for (const r of root.querySelectorAll<HTMLInputElement>('input[name="kg-theme"]')) {
    r.addEventListener('change', () => r.checked && setSettings({ theme: r.value as ThemeSetting }));
  }
  for (const b of root.querySelectorAll<HTMLButtonElement>('.kg-accent-chip')) {
    b.addEventListener('click', () => {
      applyAccent(b.dataset.accent as string);
      root.querySelectorAll('.kg-accent-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      sfx.click();
    });
  }
  root.querySelectorAll<HTMLInputElement>('.g92-range').forEach((r) => bindRange(r));
  root.querySelectorAll<HTMLButtonElement>('[data-anim]').forEach((b) => b.addEventListener('click', () => flash(b, b.dataset.anim as string)));
  root.querySelectorAll<HTMLButtonElement>('[data-sfx]').forEach((b) => b.addEventListener('click', () => sfx.play(b.dataset.sfx as SfxName)));
  root.querySelectorAll<HTMLButtonElement>('[data-toast]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.toast === 'action') {
        toast('Je k dispozici nová verze.', { icon: UI_ICONS.sparkle, action: { label: 'Obnovit', onClick: () => toast('Obnovuji…') } });
        return;
      }
      const v = b.dataset.toast as 'default' | 'success' | 'danger' | 'accent';
      const msg = { default: 'Uloženo.', success: 'Správně! Skvělá práce.', danger: 'Ups, to nevyšlo.', accent: 'Nový rekord!' }[v];
      toast(msg, { variant: v, icon: v === 'success' ? UI_ICONS.check : v === 'danger' ? UI_ICONS.cross : v === 'accent' ? UI_ICONS.trophy : undefined });
    }),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-demo]').forEach((b) => b.addEventListener('click', () => void demo(b.dataset.demo as string)));
}

async function demo(kind: string): Promise<void> {
  switch (kind) {
    case 'dialog':
      openDialog({
        title: 'Jak hrát',
        icon: UI_ICONS.help,
        content: '<p>Klepni na komára dřív, než tě štípne. Za každého dostaneš bod.</p><p class="g92-muted">Dialog umí libovolný obsah a tlačítka.</p>',
        actions: [
          { label: 'Zavřít', variant: 'secondary' },
          { label: 'Rozumím', autofocus: true },
        ],
      });
      break;
    case 'confirm':
      toast((await confirmDialog({ title: 'Začít znovu?', message: 'Rozehraná hra se ztratí.', confirmLabel: 'Začít znovu', danger: true })) ? 'Potvrzeno' : 'Zrušeno');
      break;
    case 'alert':
      await alertDialog({ title: 'Hotovo!', message: 'Všechno je uložené.', icon: UI_ICONS.check });
      break;
    case 'settings':
      openSettingsDialog();
      break;
    case 'start': {
      const r = await showStart({
        appId: 'komari',
        difficulties: [
          { id: 'easy', label: 'Lehká', icon: '🐢' },
          { id: 'normal', label: 'Střední', icon: '🐇' },
          { id: 'hard', label: 'Těžká', icon: '🔥' },
        ],
        difficulty: 'normal',
        best: { label: 'Rekord', value: 1240 },
        howTo: [
          { icon: '👆', text: 'Klepni na komára' },
          { icon: '⏱️', text: 'Stihni to včas' },
          { icon: '⭐', text: 'Sbírej hvězdy' },
        ],
        keys: [
          { keys: ['Mezerník'], text: 'pauza' },
          { keys: ['F'], text: 'celá obrazovka' },
        ],
      });
      toast(`Hrajeme: ${r.difficulty}`);
      break;
    }
    case 'pause':
      toast(`Volba: ${await showPause({ menuHref: null, stats: [{ label: 'Skóre', value: 420 }, { label: 'Čas', value: '1:12' }] })}`);
      break;
    case 'results':
      toast(
        `Volba: ${await showResults({
          score: 1380,
          best: 1380,
          isNewBest: true,
          stars: 3,
          menuHref: null,
          stats: [
            { label: 'Přesnost', value: '94 %' },
            { label: 'Čas', value: '2:05' },
            { label: 'Combo', value: 12 },
          ],
        })}`,
      );
      break;
    case 'results2':
      toast(`Volba: ${await showResults({ score: 230, best: 1380, stars: 1, menuHref: null })}`);
      break;
    case 'lost':
      toast(`Volba: ${await showResults({ lost: true, score: 90, best: 1380, menuHref: null, subtitle: 'Komáři tě tentokrát dostali.' })}`);
      break;
    case 'countdown':
      await countdown();
      toast('Start!');
      break;
    case 'confetti':
      if (!confetti({ cannons: true })) toast('Konfety jsou vypnuté (omezené animace).');
      break;
  }
}

// appbar "?" → setHelp() content (the kit's default help dialog)
setHelp({
  title: 'O téhle stránce',
  intro: 'Průvodce stylem pro všechny aplikace garon92. Přepni motiv nebo barvu aplikace a podívej se, jak se komponenty chovají.',
  howTo: [
    { icon: '🎨', text: 'Přepni motiv a barvu nahoře' },
    { icon: '👆', text: 'Vyzkoušej tlačítka a dialogy' },
    { icon: '🎮', text: 'Spusť ukázky herních obrazovek' },
  ],
  extra: '<p class="g92-hint">Pro vývojáře: <code>menu/kit/README.md</code>, synchronizace do aplikací: <code>bash menu/kit/sync.sh &lt;app&gt;</code>.</p>',
});

subscribeSettings((n, prev) => {
  if (n.theme !== prev.theme) {
    root.querySelectorAll<HTMLInputElement>('input[name="kg-theme"]').forEach((r) => (r.checked = r.value === n.theme));
  }
});

render();

import '../kit/kit.css';
import './menu.css';
import { UI_ICONS } from '../kit/dom';
import { getSettings, setSettings, subscribeSettings, type ThemeSetting } from '../kit/settings';
import { countLabel } from '../kit/cz';
import { CATEGORIES, PROJECTS, matchesProject, type CategoryId, type Project } from './projects';
import { escapeHTML } from './util';
import { installPrompt } from './install';

const main = document.getElementById('main') as HTMLElement;
const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
let category: CategoryId | 'all' = 'all';

function cardHTML(project: Project): string {
  const secondary = project.secondaryLink;
  return `<article class="project-card g92-accent" style="--accent:${project.accent}" data-project="${project.id}">
    <a class="project-card__link" href="${escapeHTML(project.href)}" aria-labelledby="project-${project.id}">
      <div class="project-card__top"><span class="project-card__icon">${project.icon}</span><span class="project-card__label">${escapeHTML(project.label)}</span></div>
      <h3 id="project-${project.id}">${escapeHTML(project.name)}</h3>
      <p class="project-card__description">${escapeHTML(project.description)}</p>
      <span class="project-card__action">${escapeHTML(project.action)}${UI_ICONS.arrowRight}</span>
    </a>
    ${secondary ? `<a class="project-card__secondary" href="${escapeHTML(secondary.href)}">${escapeHTML(secondary.label)}</a>` : ''}
  </article>`;
}

main.innerHTML = `
  <div class="masthead">
    <a class="brand" href="/menu/" aria-label="Garon92 — všechny projekty"><span class="brand__icon">${UI_ICONS.grid}</span>Garon92<span class="brand__divider">/</span><span class="brand__section">rozcestník</span></a>
    <label class="theme-picker">${UI_ICONS.sun}<span class="sr-only">Barevný motiv</span><select id="theme"><option value="auto">Podle zařízení</option><option value="light">Světlý motiv</option><option value="dark">Tmavý motiv</option></select></label>
  </div>
  <header class="hero">
    <div class="hero__heading"><h1>Moje projekty<span aria-hidden="true">.</span></h1><span class="project-total">${countLabel(PROJECTS.length, 'projekt', 'projekty', 'projektů')}</span></div>
    <p>Hry, učení, tvoření a weby. Všechno na jednom místě.</p>
  </header>
  <section class="browse" aria-label="Najít projekt">
    <div class="search-box">${searchIcon}<label class="sr-only" for="search">Hledat projekty</label><input id="search" type="search" placeholder="Hledat projekt, téma nebo web…" autocomplete="off" spellcheck="false" aria-controls="projects"/><button type="button" class="search-clear" aria-label="Vymazat hledání" hidden>${UI_ICONS.cross}</button></div>
    <div class="filters" role="group" aria-label="Skupina projektů">
      <button type="button" class="filter" data-category="all" aria-pressed="true">Všechny<span>${PROJECTS.length}</span></button>
      ${CATEGORIES.map((group) => `<button type="button" class="filter" data-category="${group.id}" aria-pressed="false">${escapeHTML(group.title)}<span>${PROJECTS.filter((p) => p.category === group.id).length}</span></button>`).join('')}
    </div>
  </section>
  <p class="offline-note" role="status" hidden>Jsi offline. Rozcestník funguje, ale otevření projektů a stažení hry může vyžadovat internet.</p>
  <p class="search-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="projects" tabindex="-1"></div>
  <footer class="menu-footer"><p>Garon92 <span aria-hidden="true">·</span> Odkazy na moje projekty</p><button class="g92-btn g92-btn--ghost g92-btn--sm" type="button" data-action="install" hidden>${UI_ICONS.grid}Nainstalovat rozcestník</button><a href="#main">Nahoru ↑</a></footer>
`;

const search = main.querySelector<HTMLInputElement>('#search')!;
const clear = main.querySelector<HTMLButtonElement>('.search-clear')!;
const results = main.querySelector<HTMLElement>('#projects')!;
const status = main.querySelector<HTMLElement>('.search-status')!;
const theme = main.querySelector<HTMLSelectElement>('#theme')!;

function renderProjects(): void {
  const projects = PROJECTS.filter((project) => (category === 'all' || project.category === category) && matchesProject(project, search.value));
  const filtered = category !== 'all' || Boolean(search.value.trim());
  clear.hidden = !search.value;
  status.textContent = filtered ? `Zobrazeno ${projects.length} z ${PROJECTS.length} projektů` : '';
  for (const button of main.querySelectorAll<HTMLButtonElement>('[data-category]')) {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  }
  results.innerHTML = CATEGORIES.map((group) => {
    const items = projects.filter((project) => project.category === group.id);
    if (!items.length) return '';
    return `<section class="category" aria-labelledby="category-${group.id}">
      <div class="section-head"><h2 id="category-${group.id}">${escapeHTML(group.title)}<span class="section-count">${items.length}</span></h2><p>${escapeHTML(group.description)}</p></div>
      <div class="project-grid">${items.map(cardHTML).join('')}</div>
    </section>`;
  }).join('') || `<div class="empty-state">${searchIcon}<h2>Žádný projekt nenalezen</h2><p>Zkus jiný název nebo zobraz všechny projekty.</p><button type="button" class="g92-btn" data-action="reset">Zobrazit všechny projekty</button></div>`;
  results.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    category = 'all';
    search.value = '';
    renderProjects();
    search.focus();
  });
}

search.addEventListener('input', renderProjects);
clear.addEventListener('click', () => {
  search.value = '';
  renderProjects();
  search.focus();
});
main.querySelector('.filters')!.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-category]');
  if (!button) return;
  category = button.dataset.category as CategoryId | 'all';
  renderProjects();
});
search.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    search.value = '';
    renderProjects();
  }
});
theme.value = getSettings().theme;
theme.addEventListener('change', () => setSettings({ theme: theme.value as ThemeSetting }));
subscribeSettings((settings) => { theme.value = settings.theme; });
function updateOffline(): void {
  main.querySelector<HTMLElement>('.offline-note')!.hidden = navigator.onLine;
}
window.addEventListener('online', updateOffline);
window.addEventListener('offline', updateOffline);
window.addEventListener('pageshow', renderProjects);
installPrompt.bind(main.querySelector('[data-action="install"]'));
updateOffline();
renderProjects();

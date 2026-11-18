import '../kit/kit.css';
import './menu.css';
import { UI_ICONS } from '../kit/dom';
import { getSettings, setSettings, subscribeSettings, type ThemeSetting } from '../kit/settings';
import { CATEGORIES, PROJECTS, matchesProject, type Project } from './projects';
import { escapeHTML } from './util';
import { installPrompt } from './install';

const main = document.getElementById('main') as HTMLElement;
const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const downloadIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>';

function projectRow(project: Project): string {
  return `<a class="project g92-accent" style="--accent:${project.accent}" data-project="${project.id}" href="${escapeHTML(project.href)}" aria-labelledby="name-${project.id}" aria-describedby="desc-${project.id}">
    <span class="project-icon">${project.icon}</span>
    <span class="project-copy"><strong id="name-${project.id}">${escapeHTML(project.name)}</strong><span id="desc-${project.id}">${escapeHTML(project.description)}</span></span>
    <span class="row-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function downloadRow(project: Project): string {
  const more = project.secondaryLink;
  return `<article class="download-row g92-accent" style="--accent:${project.accent}" data-project="${project.id}">
    <span class="project-icon">${project.icon}</span>
    <div class="download-copy"><h3>${escapeHTML(project.name)}</h3><span>${escapeHTML(project.label)}</span><p>${escapeHTML(project.description)}</p></div>
    <div class="download-actions">${more ? `<a class="version" href="${escapeHTML(more.href)}">Verze<span class="sr-only"> · ${escapeHTML(project.name)}</span></a>` : ''}
      <a class="download-button" href="${escapeHTML(project.href)}">${downloadIcon}${escapeHTML(project.action)}<span class="sr-only"> · ${escapeHTML(project.name)}</span></a></div>
  </article>`;
}

main.innerHTML = `
  <header class="masthead">
    <a class="brand" href="/menu/" aria-label="Garon92 — všechny projekty"><span>${UI_ICONS.grid}</span>Garon92</a>
    <label class="theme-picker">${UI_ICONS.sun}<span class="sr-only">Barevný motiv</span><select id="theme"><option value="auto">Podle zařízení</option><option value="light">Světlý motiv</option><option value="dark">Tmavý motiv</option></select></label>
  </header>
  <section class="toolbar" aria-labelledby="title">
    <h1 id="title">Moje projekty</h1>
    <div class="browse">
      <div class="search-box">${searchIcon}<label class="sr-only" for="search">Hledat projekty</label><input id="search" type="search" placeholder="Hledat projekt…" autocomplete="off" spellcheck="false" aria-controls="projects"/></div>
      <label class="category-picker"><span class="sr-only">Skupina projektů</span><select id="group" aria-controls="projects"><option value="all">Všechny skupiny</option>${CATEGORIES.map(group => `<option value="${group.id}">${escapeHTML(group.title)}</option>`).join('')}</select></label>
    </div>
  </section>
  <p class="offline-note" role="status" hidden>Jsi offline. Některé projekty a stažení APK vyžadují připojení.</p>
  <p class="search-status" role="status" aria-live="polite"></p>
  <div id="projects" tabindex="-1"></div>
  <footer class="menu-footer"><button class="g92-btn g92-btn--ghost g92-btn--sm" type="button" data-action="install" hidden>${UI_ICONS.grid}Nainstalovat rozcestník</button></footer>`;

const search = main.querySelector<HTMLInputElement>('#search')!;
const group = main.querySelector<HTMLSelectElement>('#group')!;
const results = main.querySelector<HTMLElement>('#projects')!;
const status = main.querySelector<HTMLElement>('.search-status')!;
const theme = main.querySelector<HTMLSelectElement>('#theme')!;
const mobile = matchMedia('(max-width: 740px)');
const expanded = new Set<string>();

function renderProjects(): void {
  const filtered = group.value !== 'all' || Boolean(search.value.trim());
  const projects = PROJECTS.filter(project =>
    (group.value === 'all' || project.category === group.value) && matchesProject(project, search.value));
  status.textContent = filtered ? `Zobrazeno ${projects.length} z ${PROJECTS.length} projektů` : '';

  const downloads = projects.filter(project => project.category === 'download');
  const groups = CATEGORIES.filter(category => category.id !== 'download').map(category => {
    const items = projects.filter(project => project.category === category.id);
    if (!items.length) return '';
    const open = filtered || !mobile.matches || expanded.has(category.id);
    const preview = items.slice(0, 3).map(p => escapeHTML(p.name)).join(' · ');
    return `<details class="group group--${category.id}" data-group="${category.id}" ${open ? 'open' : ''}>
      <summary><span class="group-title">${escapeHTML(category.title)}</span><span class="count">${items.length}</span><span class="chevron" aria-hidden="true"></span><span class="group-preview" aria-hidden="true">${preview}…</span></summary>
      <div class="project-list">${items.map(projectRow).join('')}</div></details>`;
  }).filter(Boolean);

  results.innerHTML = `${downloads.length ? `<section class="downloads" aria-labelledby="downloads-title"><h2 id="downloads-title">Ke stažení</h2>${downloads.map(downloadRow).join('')}</section>` : ''}
    ${groups.length ? `<div class="groups${groups.length === 1 ? ' groups--single' : ''}">${groups.join('')}</div>` : ''}
    ${!projects.length ? '<div class="empty-state"><h2>Žádný projekt nenalezen</h2><button class="g92-btn" data-action="reset">Zobrazit všechny projekty</button></div>' : ''}`;
  if (mobile.matches && !filtered) {
    for (const panel of results.querySelectorAll<HTMLDetailsElement>('details')) {
      panel.addEventListener('toggle', () => {
        if (!panel.isConnected) return;
        const id = panel.dataset.group!;
        if (panel.open) expanded.add(id);
        else expanded.delete(id);
      });
    }
  }
}

results.addEventListener('click', event => {
  if (!(event.target instanceof Element) || !event.target.closest('[data-action="reset"]')) return;
  group.value = 'all';
  search.value = '';
  renderProjects();
  search.focus();
});
search.addEventListener('input', renderProjects);
group.addEventListener('change', renderProjects);
mobile.addEventListener('change', renderProjects);
theme.value = getSettings().theme;
theme.addEventListener('change', () => setSettings({ theme: theme.value as ThemeSetting }));
subscribeSettings(settings => { theme.value = settings.theme; });
function updateOffline(): void {
  main.querySelector<HTMLElement>('.offline-note')!.hidden = navigator.onLine;
}
window.addEventListener('online', updateOffline);
window.addEventListener('offline', updateOffline);
window.addEventListener('pageshow', renderProjects);
installPrompt.bind(main.querySelector('[data-action="install"]'));
updateOffline();
renderProjects();

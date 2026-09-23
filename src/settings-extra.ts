import { UI_ICONS, clearActivity, confirmDialog, countLabel, getActivity, h, sfx, toast } from '../kit';

/** Menu-specific section of the settings dialog. */
export function settingsExtra(onChange: () => void): HTMLElement {
  const count = Object.keys(getActivity()).length;
  const btn = h('button', { type: 'button', class: 'g92-btn g92-btn--secondary g92-btn--sm', html: UI_ICONS.restart }, 'Vymazat historii');
  btn.disabled = count === 0;
  btn.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Vymazat historii?',
      message: 'Zmizí seznam „Pokračovat“ a statistiky na kartičkách. Rekordy a postup v jednotlivých hrách zůstanou.',
      confirmLabel: 'Vymazat',
      danger: true,
    });
    if (!ok) return;
    clearActivity();
    sfx.whoosh();
    btn.disabled = true;
    toast('Historie je smazaná.');
    onChange();
  });
  return h(
    'div',
    { class: 'g92-field' },
    h('span', { class: 'g92-label' }, 'Historie v menu'),
    h('div', { class: 'g92-row', style: 'justify-content: space-between; flex-wrap: wrap' }, h('span', { class: 'g92-hint' }, count ? `Záznamy: ${countLabel(count, 'aplikace', 'aplikace', 'aplikací')}` : 'Zatím prázdná'), btn),
  );
}

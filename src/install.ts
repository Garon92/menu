import { UI_ICONS, sfx, toast } from '../kit';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let button: HTMLButtonElement | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  if (button) button.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  if (button) button.hidden = true;
  toast('Menu je nainstalované. Najdeš ho mezi aplikacemi.', { variant: 'success', icon: UI_ICONS.check });
});

export const installPrompt = {
  bind(btn: HTMLButtonElement | null): void {
    button = btn;
    if (!btn) return;
    btn.hidden = !deferred;
    btn.addEventListener('click', async () => {
      if (!deferred) return;
      sfx.tap();
      const ev = deferred;
      deferred = null;
      btn.hidden = true;
      await ev.prompt();
      await ev.userChoice.catch(() => undefined);
    });
  },
};

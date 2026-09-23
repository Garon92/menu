# Menu (rozcestník) + g92 kit

Rozcestník všech her a procvičování na **https://garon92.github.io/menu/** a zároveň domov
sdíleného design systému **g92 kit** (`kit/`), který používají všechny ostatní aplikace.

## Co umí menu

- Pozdrav podle denní doby (a jména, pokud ho zadáš — „Dobré odpoledne, Adámku!“).
- **Pokračovat** — naposledy otevřené aplikace s rekordem / postupem.
- Kartičky **Učení** a **Hry** s ikonou, barvou aplikace a živými statistikami
  (rekord, postup v %, „naposledy před 2 dny“) — aplikace je zapisují přes `kit/activity.ts`.
- Nastavení platné pro všechny aplikace: zvuk a hlasitost, světlý/tmavý motiv, omezení animací, jméno.
- Jemné animované pozadí (vypne se při „omezit animace“), instalace jako aplikace (PWA, funguje offline).
- Průvodce stylem kitu: **/menu/kit.html**.

## Vývoj

```bash
npm install
npm run dev        # http://localhost:5170/menu/
npm run build      # typecheck + build do dist/
npm run preview    # náhled buildu na :5170
npm run typecheck
npm test           # Vitest: store, settings, activity, čeština
node scripts/shots.mjs ../_night/shots/menu   # screenshoty (běžící preview + Google Chrome)
```

Stack: Vite + TypeScript (strict), bez frameworku, `vite-plugin-pwa`.

## g92 kit

Kanonický zdroj je `kit/` v tomto repu, dokumentace v [`kit/README.md`](kit/README.md).
Do ostatních aplikací se kopíruje:

```bash
bash kit/sync.sh tanky      # nebo více aplikací, nebo --all
```

Ikony pro PWA aplikace: `node --experimental-strip-types kit/scripts/pwa-icons.mjs <app> <app>/public`.

## Nasazení

GitHub Actions (`.github/workflows/deploy.yml`): push do `main` → typecheck, testy, build → GitHub Pages.
V nastavení repozitáře musí být **Settings → Pages → Source: GitHub Actions**.

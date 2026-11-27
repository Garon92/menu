# Menu — moje projekty

Rozcestník na **https://garon92.github.io/menu/**. Obsahuje 18 projektů:

- **Učení a tvoření:** Matematika, Čeština, Angličtina, BioLab, Náramky, MusicLab.
- **Hry a simulace:** Tanky, Ryby, Komáři, Spojovačka, Dots, Karty pro nás.
- **Weby:** Domškoláci, Kostičková Parta, Mravenci, Trilobiti, PureMU.
- **Ke stažení:** Letadlo pro Android, se stabilním odkazem na nejnovější APK a informace o verzi.

Karty vedou přímo na stávající adresy projektů. Menu nic nehostuje místo nich,
nesbírá herní statistiky ani osobní údaje a neobsahuje pracovní náhledy.

## Ovládání a údržba

Hledání funguje podle názvu, tématu i adresy, nerozlišuje diakritiku ani velikost
písmen. Lze ho kombinovat s filtrem skupiny. Světlý/tmavý motiv sdílí existující
nastavení rodiny aplikací; výchozí motiv se řídí zařízením.
Rozcestník lze nainstalovat jako PWA. Uložený rozcestník je dostupný offline,
samotné cílové projekty a stažení APK ale mohou vyžadovat internet.

**Seznam projektů se upravuje v `src/projects.ts`.** Každá položka obsahuje
název, stručný popis, skupinu, štítek, ikonu, barvu a cílovou adresu. Volitelně
má další hledaná slova a vedlejší odkaz. Skupiny i počty se vykreslují z tohoto
seznamu. Externí projekty se nepřidávají do registru sdíleného herního kitu.

## Vývoj

```bash
npm install
npm run dev        # http://localhost:5170/menu/
npm run typecheck
npm test
npm run build      # typecheck + produkční build do dist/
npm run preview
```

Vite + TypeScript, bez frameworku, `vite-plugin-pwa`.

## Sdílený g92 kit

Repozitář je také domovem sdíleného design systému **g92 kit**. Jeho kanonický
zdroj zůstává v `kit/`, dokumentace v [`kit/README.md`](kit/README.md) a vizuální
průvodce na **https://garon92.github.io/menu/kit.html**. Původní hry a výukové
aplikace nadále používají jeho samostatný registr a nastavení.

```bash
bash kit/sync.sh tanky      # nebo více aplikací, nebo --all
```

## Nasazení

Push do `main` spouští `.github/workflows/deploy.yml`: typecheck, testy,
produkční build a nasazení na GitHub Pages.

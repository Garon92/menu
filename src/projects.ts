import { APPS, type AppId } from '../kit/apps';

export type CategoryId = 'learn' | 'play' | 'web' | 'download';

export interface Project {
  id: string;
  name: string;
  description: string;
  href: string;
  label: string;
  category: CategoryId;
  icon: string;
  accent: string;
  action: string;
  keywords?: string;
  secondaryLink?: { label: string; href: string };
}

export const CATEGORIES: readonly { id: CategoryId; title: string; description: string }[] = [
  { id: 'learn', title: 'Učení a tvoření', description: 'Procvičování, objevování a vlastní nápady.' },
  { id: 'play', title: 'Hry a simulace', description: 'Na společné hraní i chvíli pro sebe.' },
  { id: 'web', title: 'Weby', description: 'Vzdělávání, příroda a herní komunity.' },
  { id: 'download', title: 'Ke stažení', description: 'Aplikace k instalaci do zařízení.' },
];

const svg = (body: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const duo = 'fill="currentColor" fill-opacity=".2"';

const icons = {
  musiclab: svg(`<path d="M9 17V6l11-3v11M9 9l11-3"/><ellipse cx="6" cy="17.5" rx="3" ry="2.5" ${duo}/><ellipse cx="17" cy="14.5" rx="3" ry="2.5" ${duo}/>`),
  biolab: svg('<path d="M7 3c0 7 10 11 10 18M17 3c0 7-10 11-10 18M7.4 5h9.2M9.5 9h5M9.5 15h5M7.4 19h9.2"/>'),
  naramky: svg(`<circle cx="12" cy="4" r="2.3" ${duo}/><circle cx="19" cy="8" r="2.3"/><circle cx="19" cy="16" r="2.3" ${duo}/><circle cx="12" cy="20" r="2.3"/><circle cx="5" cy="16" r="2.3" ${duo}/><circle cx="5" cy="8" r="2.3"/>`),
  karty: svg(`<rect x="6.5" y="3.5" width="13" height="17" rx="2.5" ${duo}/><path d="M6.5 6.5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10M10 8h6M10 12h4M10 16h3"/>`),
  domskolaci: svg(`<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" ${duo}/><path d="M12 12c-1.5-1-3-1.5-5-1v6c2-.5 3.5 0 5 1 1.5-1 3-1.5 5-1v-6c-2-.5-3 0-5 1Zm0 0v6"/>`),
  kosticky: svg(`<path d="m12 3 9 5v9l-9 5-9-5V8Z" ${duo}/><path d="m3 8 9 5 9-5M12 13v9M7.5 5.5l9 5M7.5 10.5v9M16.5 10.5v9M3 12.5l9 5 9-5"/>`),
  mravenci: svg(`<ellipse cx="12" cy="17.5" rx="3" ry="4" ${duo}/><circle cx="12" cy="10.5" r="2"/><circle cx="12" cy="5.5" r="2.5" ${duo}/><path d="m10.5 3.5-2-2m5 2 2-2M10 10 6 8l-3 2m11 0 4-2 3 2M10 13H5l-2 3m11-3h5l2 3M9.5 17 6 19v3m8.5-5 3.5 2v3"/>`),
  trilobiti: svg(`<path d="M12 3c-5 0-8 4-8 9 0 5 4 9 8 9s8-4 8-9c0-5-3-9-8-9Z" ${duo}/><path d="M9 4v15m6-15v15M4.5 9h15M4 13h16M5.5 17h13M9 6h6"/>`),
  puremu: svg(`<path d="m16 3 5 0v5L9 20l-5-5Z" ${duo}/><path d="m6 13 5 5M4 20l-2 2M8 17l-4 4M15 9l4-4M3 12l9 9"/>`),
  letadlo: svg(`<path d="m21 3-5 18-4-7-7-4Z" ${duo}/><path d="m12 14 9-11M3 16l-1 1m5 2-2 2"/>`),
};

function familyApp(id: Exclude<AppId, 'menu'>, description: string, keywords: string): Project {
  const app = APPS.find((entry) => entry.id === id)!;
  const learning = app.category === 'learn';
  return {
    id,
    name: app.name,
    description,
    href: `https://garon92.github.io${app.path}`,
    label: learning ? 'Výuková aplikace' : id === 'dots' ? 'Simulace' : 'Hra',
    category: learning ? 'learn' : 'play',
    icon: app.icon,
    accent: app.accent,
    action: learning || id === 'dots' ? 'Otevřít' : 'Hrát',
    keywords,
  };
}

/** Public destinations belong to the directory, independently of the shared game kit. */
export const PROJECTS: readonly Project[] = [
  familyApp('matematika', 'Počítání hrou: sčítání, odčítání, násobení a dělení.', 'počty příklady násobilka děti'),
  familyApp('cestina', 'Čtení a psaní od prvních písmen přes slova až k větám.', 'abeceda slabiky poslech děti'),
  familyApp('anglictina', 'Slovíčka, gramatika a cvičné testy k maturitě.', 'anglicky english jazyky'),
  {
    id: 'biolab',
    name: 'BioLab',
    description: 'Interaktivní průvodce DNA, genetikou a dědičností.',
    href: 'https://garon92.github.io/BioLab/',
    label: 'Výuková aplikace',
    category: 'learn',
    icon: icons.biolab,
    accent: '#0d9488',
    action: 'Otevřít',
    keywords: 'biologie věda geny',
  },
  {
    id: 'naramky',
    name: 'Náramky',
    description: 'Navrhování korálkových náramků s 3D náhledem a postupem výroby.',
    href: 'https://garon92.github.io/Naramky/',
    label: 'Tvoření',
    category: 'learn',
    icon: icons.naramky,
    accent: '#c2418c',
    action: 'Otevřít',
    keywords: 'korálky šperky návrhář plánovač',
  },
  {
    id: 'musiclab',
    name: 'MusicLab',
    description: 'Skládej rytmy a melodie, míchej stopy a ulož skladbu jako WAV.',
    href: 'https://garon92.github.io/MusicLab/',
    label: 'Hudební studio',
    category: 'learn',
    icon: icons.musiclab,
    accent: '#26865c',
    action: 'Otevřít',
    keywords: 'hudba hudební studio music lab sekvencer syntezátor bicí mixér sampler MIDI Pocket Band',
  },
  familyApp('tanky', 'Tahová tanková bitva s mířením, větrem a zničitelným terénem.', 'souboj střelba rodina'),
  familyApp('ryby', 'Rybaření s českými rybami, sbírkou úlovků a misemi.', 'rybaření rybolov album'),
  familyApp('komari', 'Postřehová hra s plácačkou na dotěrné komáry.', 'postřeh plácání hmyz'),
  familyApp('spojovacka', 'Spojování tří stejných tvarů s řetězovými reakcemi.', 'logika puzzle match3'),
  familyApp('dots', 'Simulace barevných částic, ze kterých vznikají živé vzory.', 'tečky buňky řetězy particle life'),
  {
    id: 'karty',
    name: 'Karty pro nás',
    description: 'Rodinná hra s otázkami pro společné povídání.',
    href: 'https://garon92.github.io/KartyProNas/',
    label: 'Hra',
    category: 'play',
    icon: icons.karty,
    accent: '#c55b39',
    action: 'Hrát',
    keywords: 'otázky rozhovory rodina vztahy',
  },
  {
    id: 'domskolaci',
    name: 'Domškoláci',
    description: 'Online cvičení pro děti a domácí vzdělávání.',
    href: 'https://domskolaci.info/',
    label: 'Web',
    category: 'web',
    icon: icons.domskolaci,
    accent: '#7c5cff',
    action: 'Otevřít',
    keywords: 'škola učení předměty výuka',
  },
  {
    id: 'kostickovaparta',
    name: 'Kostičková Parta',
    description: 'Web českého rodinného Minecraft serveru pro děti.',
    href: 'https://kostickovaparta.cz/',
    label: 'Web',
    category: 'web',
    icon: icons.kosticky,
    accent: '#398345',
    action: 'Otevřít',
    keywords: 'minecraft kostky stavění mapa komunita',
  },
  {
    id: 'mravenci',
    name: 'Mravenci',
    description: 'Český atlas mravenců, určování druhů, hry a simulátor.',
    href: 'https://mravenci.info/',
    label: 'Web',
    category: 'web',
    icon: icons.mravenci,
    accent: '#a45d32',
    action: 'Otevřít',
    keywords: 'příroda hmyz mraveniště biologie',
  },
  {
    id: 'trilobiti',
    name: 'Trilobiti',
    description: 'Český atlas trilobitů, jejich stavby těla a nalezišť.',
    href: 'https://trilobiti.info/',
    label: 'Web',
    category: 'web',
    icon: icons.trilobiti,
    accent: '#a17437',
    action: 'Otevřít',
    keywords: 'fosilie zkameněliny paleontologie pravěk Barrandien',
  },
  {
    id: 'puremu',
    name: 'PureMU',
    description: 'Web projektu rodinného serveru MU Online.',
    href: 'https://puremu.cz/',
    label: 'Web',
    category: 'web',
    icon: icons.puremu,
    accent: '#7164ba',
    action: 'Otevřít',
    keywords: 'mu online mmorpg fantasy hra server',
  },
  {
    id: 'letadlo',
    name: 'Letadlo',
    description: 'Letecká hra pro Android ovládaná náklonem telefonu.',
    href: 'https://github.com/Garon92/Letadlo/releases/latest/download/Letadlo.apk',
    label: 'Android 8+ · APK',
    category: 'download',
    icon: icons.letadlo,
    accent: '#2272b8',
    action: 'Stáhnout APK',
    keywords: 'mobil telefon letoun létání hra instalace',
    secondaryLink: { label: 'Verze a informace', href: 'https://github.com/Garon92/Letadlo/releases/latest' },
  },
];

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('cs-CZ');
}

export function matchesProject(project: Project, query: string): boolean {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const category = CATEGORIES.find((entry) => entry.id === project.category)?.title ?? '';
  const text = normalize([project.name, project.description, project.label, project.keywords, project.href, category].join(' '));
  return terms.every((term) => text.includes(term));
}

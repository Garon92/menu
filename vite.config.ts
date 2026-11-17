import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { g92NotFoundPage, g92Pwa } from './kit/pwa.ts';

export default defineConfig({
  base: '/menu/',
  server: { port: 5170, strictPort: true },
  preview: { port: 5170 },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        kit: resolve(import.meta.dirname, 'kit.html'),
      },
    },
  },
  plugins: [VitePWA(g92Pwa('menu', {
    name: 'Moje projekty – Garon92',
    shortName: 'Moje projekty',
    description: 'Rozcestník her, učení, tvoření, webů a souborů ke stažení.',
    navigateFallbackDenylist: [/kit\.html$/],
  })), g92NotFoundPage('menu')],
});

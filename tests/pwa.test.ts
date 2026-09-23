import { describe, expect, it } from 'vitest';
import { APPS } from '../kit/apps';
import { PWA_APPS, g92Pwa } from '../kit/pwa';

describe('pwa', () => {
  it('PWA_APPS mirrors the apps.ts registry', () => {
    for (const a of APPS) {
      const { id, name, tagline, description, category, accent, path } = a;
      expect(PWA_APPS[a.id]).toEqual({ id, name, tagline, description, category, accent, path });
    }
    expect(Object.keys(PWA_APPS).sort()).toEqual(APPS.map((a) => a.id).sort());
  });

  it('builds a scoped manifest with the app accent', () => {
    const o = g92Pwa('tanky');
    expect(o.manifest.scope).toBe('/tanky/');
    expect(o.manifest.start_url).toBe('/tanky/');
    expect(o.manifest.theme_color).toBe('#ef5350');
    expect(o.manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    expect(g92Pwa('cestina', { noNavigateFallback: true }).workbox.navigateFallback).toBeNull();
  });
});

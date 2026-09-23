export function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Stable pick for the current day (changes at midnight, not on every reload). */
export function pickDaily<T>(items: readonly T[], d: Date = new Date()): T {
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  return items[((day % items.length) + items.length) % items.length] as T;
}

/** Tiny seeded PRNG (mulberry32) for deterministic decorations. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { APPS, createDaily } from '../kit';

/** Combined daily stats of the learning apps that use kit/streak.ts (read-only; same origin → shared storage). */
export function dailySummary(now = new Date()): { today: number; streak: number } {
  let today = 0;
  let streak = 0;
  for (const app of APPS) {
    if (app.category !== 'learn') continue;
    let has = false;
    try {
      has = localStorage.getItem(`g92:${app.id}:daily`) !== null;
    } catch {
      has = false;
    }
    if (!has) continue;
    const d = createDaily(app.id);
    today += d.today(now);
    streak = Math.max(streak, d.streak(now));
  }
  return { today, streak };
}

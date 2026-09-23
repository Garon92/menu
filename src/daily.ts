import { APPS, createDaily, getActivity, safeStorage } from '../kit';

export interface AppDaily {
  today: number;
  goal: number;
  done: boolean;
  streak: number;
  unit?: [string, string, string];
}

/**
 * Per-app daily status of the learning apps that use kit/streak.ts. Never summed across apps:
 * different apps count different things (examples, tasks, words) and may belong to different people.
 */
export function dailyByApp(now = new Date()): Record<string, AppDaily> {
  const out: Record<string, AppDaily> = {};
  for (const app of APPS) {
    if (app.category !== 'learn') continue;
    if (safeStorage.getItem(`g92:${app.id}:daily`) === null) continue;
    const d = createDaily(app.id);
    const today = d.today(now);
    const streak = d.streak(now);
    if (!today && !streak) continue;
    const unit = d.unit();
    out[app.id] = { today, goal: d.goal(), done: today >= d.goal(), streak, ...(unit ? { unit } : {}) };
  }
  return out;
}

/** How many apps (excluding the menu) were opened today. */
export function appsUsedToday(now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Object.entries(getActivity()).filter(([id, e]) => id !== 'menu' && APPS.some((a) => a.id === id) && e.lastOpened >= start).length;
}

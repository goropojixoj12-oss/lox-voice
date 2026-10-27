import type { PageViewEvent } from "@/lib/admin-types";

export type AnalyticsReport = {
  periodDays: number;
  totalViews: number;
  uniqueSessions: number;
  avgDepth: number;
  topPages: { path: string; views: number; share: number }[];
  recentPaths: { path: string; at: string }[];
};

function withinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return t >= Date.now() - days * 86400000;
}

export function buildAnalyticsReport(events: PageViewEvent[], periodDays = 30): AnalyticsReport {
  const windowed = events.filter((e) => withinDays(e.at, periodDays));
  const totalViews = windowed.length;
  const sessions = new Map<string, number>();
  for (const e of windowed) {
    sessions.set(e.sessionKey, (sessions.get(e.sessionKey) ?? 0) + 1);
  }
  const uniqueSessions = sessions.size;
  let depthSum = 0;
  for (const count of sessions.values()) depthSum += count;
  const avgDepth = uniqueSessions === 0 ? 0 : Math.round((depthSum / uniqueSessions) * 10) / 10;

  const byPath = new Map<string, number>();
  for (const e of windowed) {
    byPath.set(e.path, (byPath.get(e.path) ?? 0) + 1);
  }
  const topPages = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path, views]) => ({
      path,
      views,
      share: totalViews === 0 ? 0 : Math.round((views / totalViews) * 1000) / 10,
    }));

  const recentPaths = [...windowed]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)
    .map((e) => ({ path: e.path, at: e.at }));

  return {
    periodDays,
    totalViews,
    uniqueSessions,
    avgDepth,
    topPages,
    recentPaths,
  };
}

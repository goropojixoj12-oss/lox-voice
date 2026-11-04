import type { PageViewEvent } from "@/lib/admin-types";

export type AnalyticsReport = {
  periodDays: number;
  totalViews: number;
  uniqueVisitors: number;
  pages: { path: string; views: number; unique: number; share: number }[];
  recentPaths: { path: string; at: string }[];
};

function withinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return t >= Date.now() - days * 86400000;
}

/**
 * A "unique" is one analytics session cookie — one browser profile over the whole
 * period, not a person and not a visit. Views and uniques are counted separately
 * for every path, so a single visitor reading one page fifty times is 50/1.
 */
export function buildAnalyticsReport(events: PageViewEvent[], periodDays = 30): AnalyticsReport {
  const windowed = events.filter((e) => withinDays(e.at, periodDays));
  const totalViews = windowed.length;

  const viewsPerVisitor = new Map<string, number>();
  const viewsPerPath = new Map<string, number>();
  const visitorsPerPath = new Map<string, Set<string>>();
  for (const e of windowed) {
    viewsPerVisitor.set(e.sessionKey, (viewsPerVisitor.get(e.sessionKey) ?? 0) + 1);
    viewsPerPath.set(e.path, (viewsPerPath.get(e.path) ?? 0) + 1);
    let visitors = visitorsPerPath.get(e.path);
    if (!visitors) {
      visitors = new Set<string>();
      visitorsPerPath.set(e.path, visitors);
    }
    visitors.add(e.sessionKey);
  }

  const uniqueVisitors = viewsPerVisitor.size;

  const pages = [...viewsPerPath.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))
    .map(([path, views]) => ({
      path,
      views,
      unique: visitorsPerPath.get(path)?.size ?? 0,
      share: totalViews === 0 ? 0 : Math.round((views / totalViews) * 1000) / 10,
    }));

  const recentPaths = [...windowed]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)
    .map((e) => ({ path: e.path, at: e.at }));

  return {
    periodDays,
    totalViews,
    uniqueVisitors,
    pages,
    recentPaths,
  };
}

/** Views and uniques of a set of paths (used for one agent's own listing pages). */
export function sumPaths(
  events: PageViewEvent[],
  paths: Iterable<string>,
  periodDays = 30,
): { views: number; unique: number } {
  const wanted = new Set(paths);
  if (wanted.size === 0) return { views: 0, unique: 0 };
  let views = 0;
  const visitors = new Set<string>();
  for (const e of events) {
    if (!wanted.has(e.path) || !withinDays(e.at, periodDays)) continue;
    views++;
    visitors.add(e.sessionKey);
  }
  return { views, unique: visitors.size };
}

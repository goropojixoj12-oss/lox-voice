import type { Metadata } from "next";
import Link from "next/link";
import { buildAnalyticsReport } from "@/lib/admin-analytics";
import { getPageViewEvents, getAdminTasks } from "@/lib/admin-store";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { getRuntimeListings } from "@/lib/store";

export const metadata: Metadata = { title: "Executive analytics" };

export default async function AdminAnalyticsPage() {
  const [events, tasks, runtime] = await Promise.all([
    getPageViewEvents(),
    getAdminTasks(),
    getRuntimeListings(),
  ]);
  const report = buildAnalyticsReport(events, 30);
  const pending = runtime.filter((l) => l.status === "pending").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Site Data - Analytics - Statistics
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Public site traffic only (last {report.periodDays} days): one record per page the visitor
          actually opened. Dashboards, sign-in pages, known bots, and automated checks are excluded.
          &ldquo;Unique&rdquo; counts distinct analytics cookies, so one person reading the same page all
          day is one unique.
        </p>
      </div>

      {report.totalViews === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
          No page views recorded yet. Open a few pages on the site in another tab, then refresh this
          report.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Page views", report.totalViews],
          ["Unique visitors", report.uniqueVisitors],
          ["Pages tracked", report.pages.length],
          ["Pending listings", pending],
        ].map(([label, value]) => (
          <div key={String(label)} className="seaps-card rounded-[var(--radius-lg)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="seaps-card min-w-0 rounded-[var(--radius-lg)] p-5">
          <h2 className="text-lg font-semibold">Pages — views and unique visitors</h2>
          <div className="mt-3 max-h-[28rem] overflow-auto">
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 bg-[var(--color-surface)]">
                <tr className="text-left text-[var(--color-muted)]">
                  <th className="w-[64%] pb-2 pr-2 sm:w-[52%]">Path</th>
                  <th className="w-[18%] whitespace-nowrap pb-2 pl-2 text-right">Views</th>
                  <th className="w-[18%] whitespace-nowrap pb-2 pl-2 text-right">Unique</th>
                  <th className="hidden w-[12%] whitespace-nowrap pb-2 pl-2 text-right sm:table-cell">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.pages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-[var(--color-muted)]">
                      No paths yet.
                    </td>
                  </tr>
                ) : (
                  report.pages.map((row) => (
                    <tr key={row.path} className="border-t border-[var(--color-border)]">
                      <td className="break-all py-2 pr-2 font-mono text-xs">{row.path}</td>
                      <td className="whitespace-nowrap py-2 pl-2 text-right">{row.views}</td>
                      <td className="whitespace-nowrap py-2 pl-2 text-right">{row.unique}</td>
                      <td className="hidden whitespace-nowrap py-2 pl-2 text-right sm:table-cell">
                        {row.share}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="seaps-card rounded-[var(--radius-lg)] p-5">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {report.recentPaths.map((r) => (
              <li key={`${r.at}-${r.path}`} className="flex justify-between gap-2">
                <span className="truncate font-mono text-xs">{r.path}</span>
                <span className="shrink-0 text-[var(--color-muted)]">
                  {new Date(r.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2 text-sm">
            <Link href={adminDeskPath("staff")} className="font-semibold text-[var(--color-accent-soft)] hover:underline">
              Staff & performance →
            </Link>
            <Link href={adminDeskPath("legal")} className="font-semibold text-[var(--color-accent-soft)] hover:underline">
              Legal library →
            </Link>
            <Link href={adminDeskPath("listings")} className="font-semibold text-[var(--color-accent-soft)] hover:underline">
              Moderate {pending} pending listing{pending === 1 ? "" : "s"} →
            </Link>
            <p className="text-[var(--color-muted)]">{openTasks} open staff task(s)</p>
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ProfileCompletionRing } from "@/components/dashboard/profile-completion-ring";
import type { AgentOverviewBundle } from "@/lib/agent-desk-metrics";
import { cn } from "@/lib/utils";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const priorityClass = {
  high: "border-red-500/40 bg-red-500/10",
  medium: "border-amber-500/40 bg-amber-500/10",
  low: "border-[rgba(212,175,55,0.35)] bg-[var(--color-mist)]/20",
} as const;

const calendarIcon: Record<string, string> = {
  viewing: "Viewing",
  call: "Call",
  signing: "Signing",
};

export function AgentOverviewPanel({ bundle }: { bundle: AgentOverviewBundle }) {
  const { metrics } = bundle;
  const pipelineMax = Math.max(1, ...bundle.pipeline.map((s) => s.count));

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-muted)]">
          Live data: profile, inquiries, listings · Pipeline & calendar: desk estimates
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/list-property" variant="accent" size="sm">
            New listing
          </ButtonLink>
          <ButtonLink href="/dashboard/inquiries" variant="outline" size="sm">
            Inbox
          </ButtonLink>
          <ButtonLink href="/dashboard/profile" variant="outline" size="sm">
            Profile
          </ButtonLink>
        </div>
      </div>

      <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Today&apos;s priorities
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {bundle.urgentActions.map((action) => (
            <li key={action.id}>
              <Link
                href={action.href}
                className={cn(
                  "block rounded-[var(--radius-md)] border p-4 transition hover:border-[rgba(212,175,55,0.55)]",
                  priorityClass[action.priority],
                )}
              >
                <p className="font-semibold text-[var(--color-text)]">{action.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{action.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Deal pipeline
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Where your buyers sit from first lead to closing.
          </p>
          <ul className="mt-5 space-y-3">
            {bundle.pipeline.map((stage) => (
              <li key={stage.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[var(--color-text)]">{stage.label}</span>
                  <span className="font-medium text-[var(--color-accent-soft)]">{stage.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-mist)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6b5412] to-[var(--color-accent-soft)]"
                    style={{ width: `${Math.max(8, (stage.count / pipelineMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Activity & response
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Leads (7d)</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.leads7d}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Replies (7d)</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.replies7d}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Shortlists sent</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.shortlists7d}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Leads (30d)</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.leads30d}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Avg response{" "}
            <span className="font-semibold text-[var(--color-accent-soft)]">
              {bundle.activity.avgResponseMinutes} min
            </span>{" "}
            · Desk average {bundle.activity.deskAvgResponseMinutes} min
            {bundle.activity.avgResponseMinutes < bundle.activity.deskAvgResponseMinutes ? (
              <span className="text-emerald-400"> · Faster than desk</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
              Q4 closing goal
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {bundle.quarterlyGoal.closedDeals} of {bundle.quarterlyGoal.targetDeals} deals closed
              {bundle.quarterlyGoal.dealsToNextBonus > 0
                ? ` · ${bundle.quarterlyGoal.dealsToNextBonus} to next bonus tier`
                : " · Bonus tier unlocked"}
            </p>
          </div>
          <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            {bundle.quarterlyGoal.percent}%
          </span>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-mist)]"
          role="progressbar"
          aria-valuenow={bundle.quarterlyGoal.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b6914] via-[var(--color-accent-soft)] to-[#f4e4a6]"
            style={{ width: `${bundle.quarterlyGoal.percent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Profile completion
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Complete every field to unlock full desk visibility and HR verification.
          </p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ProfileCompletionRing percent={metrics.profileCompletionPercent} />
            <ul className="w-full min-w-0 space-y-2 text-sm">
              {metrics.profileItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-mist)]/30 px-3 py-2"
                >
                  <span className="text-[var(--color-text)]">{item.label}</span>
                  <span
                    className={
                      item.complete
                        ? "font-medium text-emerald-400"
                        : "text-[var(--color-muted)]"
                    }
                  >
                    {item.complete ? "Done" : `${item.weight}%`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {metrics.profileCompletionPercent < 100 ? (
            <Link
              href="/dashboard/profile"
              className="mt-4 inline-block text-sm font-medium text-[var(--color-accent-soft)] underline-offset-2 hover:underline"
            >
              Finish your agent profile →
            </Link>
          ) : null}
        </div>

        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Sales effectiveness
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {metrics.salesEffectivenessLabel} — blended response, conversion, and follow-up score.
          </p>
          <div className="mt-6">
            <div className="mb-2 flex items-end justify-between gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
                {metrics.salesEffectivenessPercent}
              </span>
              <span className="text-sm text-[var(--color-muted)]">/ 100</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-[var(--color-mist)]"
              role="progressbar"
              aria-valuenow={metrics.salesEffectivenessPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8b6914] via-[var(--color-accent-soft)] to-[#f4e4a6]"
                style={{ width: `${metrics.salesEffectivenessPercent}%` }}
              />
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">YTD sales bonus</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                {formatUsd(metrics.ytdSalesBonusUsd)}
              </dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Closed deals YTD</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                {metrics.closedDealsYtd}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="seaps-card rounded-[var(--radius-lg)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Company agent ranking</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
            #{metrics.companyRank}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            of {metrics.companyAgentCount} SEAPS agents this quarter
          </p>
        </div>
        <div className="seaps-card rounded-[var(--radius-lg)] p-5 lg:col-span-2">
          <p className="text-sm font-medium text-[var(--color-text)]">Awards & bonuses</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {metrics.awards.map((award) => (
              <li
                key={award.id}
                className="rounded-[var(--radius-md)] border border-[rgba(212,175,55,0.35)] bg-[var(--color-mist)]/25 px-3 py-2"
              >
                <p className="font-medium text-[var(--color-accent-soft)]">{award.title}</p>
                <p className="text-xs text-[var(--color-muted)]">{award.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Listing health
          </h2>
          <ul className="mt-4 space-y-2">
            {bundle.listingHealth.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm transition hover:border-[rgba(212,175,55,0.5)]"
                >
                  <span>{row.label}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      row.tone === "warn" && "text-amber-300",
                      row.tone === "ok" && "text-emerald-400",
                      row.tone === "neutral" && "text-[var(--color-accent-soft)]",
                    )}
                  >
                    {row.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {bundle.topListings.length > 0 ? (
            <>
              <p className="mt-5 text-sm font-medium text-[var(--color-text)]">Top views this week</p>
              <ul className="mt-2 space-y-2 text-sm">
                {bundle.topListings.map((row) => (
                  <li key={row.slug}>
                    <Link
                      href={`/property/${row.slug}`}
                      className="flex justify-between gap-2 text-[var(--color-accent-soft)] hover:underline"
                    >
                      <span className="truncate">{row.title}</span>
                      <span className="shrink-0 text-[var(--color-muted)]">{row.views} views</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Calendar snapshot
          </h2>
          <ul className="mt-4 space-y-3">
            {bundle.calendar.map((event) => (
              <li
                key={event.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  {calendarIcon[event.kind]}
                </p>
                <p className="mt-0.5 font-medium text-[var(--color-text)]">{event.title}</p>
                <p className="text-sm text-[var(--color-accent-soft)]">{event.whenLabel}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

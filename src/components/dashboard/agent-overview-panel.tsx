import Link from "next/link";
import type { AgentDeskMetrics } from "@/lib/agent-desk-metrics";
import { ProfileCompletionRing } from "@/components/dashboard/profile-completion-ring";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AgentOverviewPanel({ metrics }: { metrics: AgentDeskMetrics }) {
  return (
    <section className="mt-8 space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="seaps-card rounded-[var(--radius-lg)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Company agent ranking</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
            #{metrics.companyRank}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            of {metrics.companyAgentCount} SEAPS agents this quarter
          </p>
        </div>
        <div className="seaps-card rounded-[var(--radius-lg)] p-5">
          <p className="text-sm font-medium text-[var(--color-text)]">Awards & bonuses</p>
          <ul className="mt-3 space-y-3">
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
    </section>
  );
}

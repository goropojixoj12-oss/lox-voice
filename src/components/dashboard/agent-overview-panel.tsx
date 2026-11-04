import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ProfileCompletionRing } from "@/components/dashboard/profile-completion-ring";
import type { AgentOverviewBundle } from "@/lib/agent-desk-metrics";
import { cn } from "@/lib/utils";

const priorityClass = {
  high: "border-red-500/40 bg-red-500/10",
  medium: "border-amber-500/40 bg-amber-500/10",
  low: "border-[rgba(212,175,55,0.35)] bg-[var(--color-mist)]/20",
} as const;

export function AgentOverviewPanel({ bundle }: { bundle: AgentOverviewBundle }) {
  const { metrics, deskLinks } = bundle;
  const stageMax = Math.max(1, ...bundle.inquiryStages.map((s) => s.count));

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-muted)]">
          Real data only: profile fields, inquiries on this account&apos;s listings, and the page
          analytics of those listings. Nothing here is estimated or seeded.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={deskLinks.newListings} variant="accent" size="sm">
            New listing
          </ButtonLink>
          <ButtonLink href={deskLinks.inquiries} variant="outline" size="sm">
            Inbox
          </ButtonLink>
          <ButtonLink href={deskLinks.profile} variant="outline" size="sm">
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
        <div className="seaps-card min-w-0 rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Inquiries by status
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Counted from the inquiries that arrived on this account&apos;s listings.
          </p>
          <ul className="mt-5 space-y-3">
            {bundle.inquiryStages.map((stage) => (
              <li key={stage.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[var(--color-text)]">{stage.label}</span>
                  <span className="font-medium text-[var(--color-accent-soft)]">{stage.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-mist)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6b5412] to-[var(--color-accent-soft)]"
                    style={{ width: `${(stage.count / stageMax) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="seaps-card min-w-0 rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Inquiry activity
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">New in last 7 days</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.leads7d}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">New in last 30 days</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.leads30d}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Still open</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.openThreads}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <dt className="text-[var(--color-muted)]">Closed</dt>
              <dd className="mt-1 text-2xl font-semibold">{bundle.activity.closedThreads}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Response times are not measured yet — the desk does not record when a reply was sent, so
            it shows no average.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="seaps-card min-w-0 rounded-[var(--radius-lg)] p-5 md:p-6">
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
              href={deskLinks.profile}
              className="mt-4 inline-block text-sm font-medium text-[var(--color-accent-soft)] underline-offset-2 hover:underline"
            >
              Open the profile →
            </Link>
          ) : null}
        </div>

        <div className="seaps-card min-w-0 rounded-[var(--radius-lg)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Listing health
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Counted from the listings attributed to this account, by author or owner id.
          </p>
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
              <p className="mt-5 text-sm font-medium text-[var(--color-text)]">
                Most viewed of your listings
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {bundle.topListings.map((row) => (
                  <li key={row.slug}>
                    <Link
                      href={`/property/${row.slug}`}
                      className="flex justify-between gap-2 text-[var(--color-accent-soft)] hover:underline"
                    >
                      <span className="min-w-0 truncate">{row.title}</span>
                      <span className="shrink-0 text-[var(--color-muted)]">
                        {row.views} views · {row.unique} unique
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-5 text-sm text-[var(--color-muted)]">
              No page views on your listings yet. A page nobody opened shows zero — this is not
              estimated.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

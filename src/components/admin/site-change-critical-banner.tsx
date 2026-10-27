"use client";

import {
  SITE_CHANGE_CRITICAL_WARNING_INTRO,
  type SiteChangeRiskAssessment,
} from "@/lib/site-change-risk";

export function SiteChangeCriticalBanner({ risk }: { risk: SiteChangeRiskAssessment }) {
  if (risk.level !== "critical") return null;

  return (
    <div
      className="rounded-[var(--radius-md)] border border-amber-500/50 bg-amber-950/25 p-4 text-sm leading-relaxed text-amber-100"
      role="alert"
    >
      <p className="font-semibold text-amber-200">Critical settings warning</p>
      <p className="mt-2">{SITE_CHANGE_CRITICAL_WARNING_INTRO}</p>
      <ul className="mt-2 list-inside list-disc text-amber-100/90">
        {risk.topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-amber-200/80">
        You can still send this request. For hosting, secrets, or Git changes, coordinate with a
        developer first.
      </p>
    </div>
  );
}

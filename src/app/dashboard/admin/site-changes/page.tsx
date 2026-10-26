import type { Metadata } from "next";
import { SiteChangeComposer } from "@/components/admin/site-change-composer";
import { adminSiteChangeAutomationEnabled } from "@/lib/admin-platform-safety";

export const metadata: Metadata = { title: "Site change requests" };

export default function AdminSiteChangesPage() {
  const enabled = adminSiteChangeAutomationEnabled();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Site Changes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Send UI and signed-in experience change requests from here. Attach a screenshot when it
          helps.
        </p>
      </div>
      {enabled ? (
        <SiteChangeComposer />
      ) : (
        <div
          className="rounded-[var(--radius-lg)] border border-amber-500/40 bg-amber-950/20 p-5 text-sm leading-relaxed"
          role="status"
        >
          <p className="font-semibold text-amber-200">Site change automation is turned off</p>
          <p className="mt-2 text-[var(--color-muted)]">
            For site stability, admins cannot queue automated code changes from this desk. Listing
            moderation, staff tools, and public content workflows are unaffected. Developers can
            re-enable this only via server configuration (
            <code className="text-xs">SEAPS_ENABLE_SITE_CHANGE_REQUESTS</code>) after review.
          </p>
        </div>
      )}
    </div>
  );
}

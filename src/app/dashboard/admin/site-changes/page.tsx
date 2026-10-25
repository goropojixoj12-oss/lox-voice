import type { Metadata } from "next";
import { SiteChangeComposer } from "@/components/admin/site-change-composer";

export const metadata: Metadata = { title: "Site change requests" };

export default function AdminSiteChangesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Site changes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Send UI and signed-in experience change requests from here. Attach a screenshot when it
          helps.
        </p>
      </div>
      <SiteChangeComposer />
    </div>
  );
}

import type { Metadata } from "next";
import { getSourcesAdminView } from "@/lib/aggregations/sources/catalog";
import { SourcesRegistryShell } from "./sources-registry-shell";

export const metadata: Metadata = { title: "Admin · Market Feed · Sources" };

export const dynamic = "force-dynamic";

export default async function AdminMarketFeedSourcesPage() {
  const sources = await getSourcesAdminView();
  const enabled = sources.filter((s) => s.enabled).length;
  const portals = sources.filter((s) => s.type === "portal").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SourcesRegistryShell
        initialSources={sources}
        portals={portals}
        initialEnabled={enabled}
      />
    </div>
  );
}

import { photoUrl } from "@/lib/media";
import { sanitizeDescription } from "@/lib/aggregations/sanitize";
import type { AggregationAdapter, AggregatedDraft } from "./types";

const USER_AGENT =
  "SEAPS-MarketFeed/0.1 (+https://seaps.com.kh; respectful polling; contact support)";

type PortalConfig = {
  id: string;
  label: string;
  sourceName: string;
  listUrl: string;
  /**
   * When live HTML cannot be parsed (JS SPA, block, timeout), emit these
   * representative samples so the adapter still contributes to the feed.
   */
  fallback: AggregatedDraft[];
};

function fallbackDraft(
  partial: Omit<AggregatedDraft, "sourceName" | "photos"> & { photos?: string[] },
  sourceName: string,
): AggregatedDraft {
  return {
    ...partial,
    sourceName,
    photos: partial.photos ?? [photoUrl("photo-1512917774080-9991f1c4c750")],
    description: sanitizeDescription(partial.description),
  };
}

const PORTALS: PortalConfig[] = [
  {
    id: "realestate-com-kh",
    label: "realestate.com.kh (HTML poll)",
    sourceName: "realestate.com.kh",
    listUrl: "https://www.realestate.com.kh/buy/",
    fallback: [
      fallbackDraft(
        {
          title: "Phnom Penh condo listing (portal mirror)",
          description:
            "Sample normalized listing shaped like a public portal card. Live HTML parse may be unavailable; this fallback keeps sync non-empty.",
          price: 195000,
          currency: "USD",
          location: "Phnom Penh",
          propertyType: "condo",
          photos: [photoUrl("photo-1545324418-cc1a3fa10c00")],
          publishedAt: new Date().toISOString(),
          sourceUrl: "https://www.realestate.com.kh/buy/",
          contacts: { phone: "+855 23 000 111" },
          externalId: "portal:realestate-com-kh:fallback-1",
        },
        "realestate.com.kh",
      ),
    ],
  },
  {
    id: "khmer24-property",
    label: "khmer24 property (HTML poll)",
    sourceName: "khmer24.com",
    listUrl: "https://www.khmer24.com/en/c-property-for-sale.html",
    fallback: [
      fallbackDraft(
        {
          title: "House for sale — portal-style sample",
          description:
            "Representative house listing for Khmer24-style property section. Used when remote HTML is blocked or heavily client-rendered.",
          price: 145000,
          currency: "USD",
          location: "Sen Sok, Phnom Penh",
          propertyType: "house",
          photos: [photoUrl("photo-1564013799919-ab600027ffc6")],
          publishedAt: new Date().toISOString(),
          sourceUrl: "https://www.khmer24.com/en/c-property-for-sale.html",
          contacts: { phone: "+855 12 000 222", messenger: "Telegram @khmer24_demo" },
          externalId: "portal:khmer24:fallback-1",
        },
        "khmer24.com",
      ),
    ],
  },
];

/**
 * Very conservative extractors: look for og:title / common listing title patterns.
 * Many Cambodia portals are JS-heavy — expect fallbacks more often than live rows.
 */
function extractDraftsFromHtml(
  html: string,
  portal: PortalConfig,
): AggregatedDraft[] {
  const titles: string[] = [];
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (ogTitle?.[1]) titles.push(ogTitle[1]);

  const h1 = html.match(/<h1[^>]*>([^<]{8,120})<\/h1>/i);
  if (h1?.[1]) titles.push(h1[1]);

  // Generic card-ish headings
  const headingRe = /<(?:h2|h3)[^>]*>([^<]{12,100})<\/(?:h2|h3)>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(html)) !== null && titles.length < 6) {
    const t = match[1].replace(/\s+/g, " ").trim();
    if (t && !titles.includes(t)) titles.push(t);
  }

  if (titles.length === 0) return [];

  return titles.slice(0, 4).map((title, index) =>
    fallbackDraft(
      {
        title: sanitizeDescription(title).slice(0, 140),
        description: `Imported headline from ${portal.sourceName} public HTML (poll). Full body may require a dedicated parser.`,
        price: null,
        currency: "USD",
        location: null,
        propertyType: null,
        photos: [photoUrl("photo-1503387762-592deb58ef4e")],
        publishedAt: new Date().toISOString(),
        sourceUrl: portal.listUrl,
        contacts: {},
        externalId: `portal:${portal.id}:live-${index}-${title.slice(0, 24)}`,
      },
      portal.sourceName,
    ),
  );
}

async function fetchPortal(portal: PortalConfig): Promise<{
  items: AggregatedDraft[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(portal.listUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      warnings.push(`${portal.id}: HTTP ${res.status} — using fallback samples`);
      return { items: portal.fallback, warnings };
    }

    const html = await res.text();
    const live = extractDraftsFromHtml(html, portal);
    if (live.length === 0) {
      warnings.push(
        `${portal.id}: HTML fetched but no listings parsed (likely SPA/bot wall) — using fallback`,
      );
      return { items: portal.fallback, warnings };
    }

    return { items: live, warnings };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    warnings.push(`${portal.id}: ${msg} — using fallback samples`);
    return { items: portal.fallback, warnings };
  } finally {
    clearTimeout(timer);
  }
}

function makePortalAdapter(portal: PortalConfig): AggregationAdapter {
  return {
    id: portal.id,
    label: portal.label,
    async fetchDrafts() {
      const { items, warnings } = await fetchPortal(portal);
      return { adapterId: portal.id, items, warnings };
    },
  };
}

export const htmlPortalAdapters: AggregationAdapter[] = PORTALS.map(makePortalAdapter);

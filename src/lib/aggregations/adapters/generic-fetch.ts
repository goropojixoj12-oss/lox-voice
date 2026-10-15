import { photoUrl } from "@/lib/media";
import { sanitizeDescription } from "@/lib/aggregations/sanitize";
import type { AggregatedDraft } from "./types";

export const USER_AGENT =
  "SEAPS-MarketFeed/0.1 (+https://seaps.com.kh; respectful polling; contact support)";

const FETCH_TIMEOUT_MS = 6_000;

export type GenericFetchOutcome = {
  items: AggregatedDraft[];
  warnings: string[];
  /** When true, a dedicated site parser would help (empty or weak parse). */
  adapterNeeded: boolean;
  /** ok | fetch_error | blocked | adapter_needed */
  status: "ok" | "fetch_error" | "blocked" | "adapter_needed";
  message: string | null;
};

function looksBlocked(html: string, status: number): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  const lower = html.slice(0, 12_000).toLowerCase();
  return (
    lower.includes("cf-browser-verification") ||
    lower.includes("cloudflare") && lower.includes("challenge") ||
    lower.includes("captcha") ||
    lower.includes("access denied") ||
    lower.includes("bot detection")
  );
}

function draftFromTitle(
  title: string,
  sourceName: string,
  sourceUrl: string,
  sourceId: string,
  index: number,
  extra?: Partial<AggregatedDraft>,
): AggregatedDraft {
  const clean = sanitizeDescription(title).slice(0, 180);
  return {
    title: clean,
    description: extra?.description ?? `Headline from ${sourceName} (automated poll).`,
    price: extra?.price ?? null,
    currency: extra?.currency ?? "USD",
    location: extra?.location ?? null,
    propertyType: extra?.propertyType ?? null,
    photos: extra?.photos?.length ? extra.photos : [photoUrl("photo-1503387762-592deb58ef4e")],
    publishedAt: extra?.publishedAt ?? new Date().toISOString(),
    sourceUrl,
    sourceName,
    contacts: extra?.contacts ?? {},
    externalId: `generic:${sourceId}:${index}:${clean.slice(0, 32)}`,
  };
}

function extractFromHtml(html: string, sourceName: string, listUrl: string, sourceId: string): AggregatedDraft[] {
  const drafts: AggregatedDraft[] = [];
  const seen = new Set<string>();

  const pushTitle = (raw: string, extra?: Partial<AggregatedDraft>) => {
    const t = raw.replace(/\s+/g, " ").trim();
    if (t.length < 8 || t.length > 160) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    drafts.push(
      draftFromTitle(t, sourceName, listUrl, sourceId, drafts.length, extra),
    );
  };

  // JSON-LD Product / RealEstateListing / Offer
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch: RegExpExecArray | null;
  while ((ldMatch = ldRe.exec(html)) !== null && drafts.length < 12) {
    try {
      const parsed = JSON.parse(ldMatch[1].trim()) as unknown;
      const nodes = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "@graph" in parsed
          ? (parsed as { "@graph": unknown[] })["@graph"]
          : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const n = node as Record<string, unknown>;
        const type = String(n["@type"] ?? "");
        if (
          /RealEstate|Product|Offer|Apartment|House|Residence|Listing/i.test(type) ||
          n.name
        ) {
          const name = typeof n.name === "string" ? n.name : null;
          if (name) {
            let price: number | null = null;
            const offers = n.offers as Record<string, unknown> | undefined;
            if (offers?.price) {
              const p = Number(offers.price);
              if (!Number.isNaN(p)) price = p;
            }
            pushTitle(name, { price });
          }
        }
      }
    } catch {
      /* ignore bad JSON-LD */
    }
  }

  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (ogTitle?.[1]) pushTitle(ogTitle[1]);

  const h1 = html.match(/<h1[^>]*>([^<]{8,140})<\/h1>/i);
  if (h1?.[1]) pushTitle(h1[1]);

  const headingRe = /<(?:h2|h3|a)[^>]*(?:class=["'][^"']*(?:listing|property|title)[^"']*["'])[^>]*>([^<]{10,120})<\/(?:h2|h3|a)>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(html)) !== null && drafts.length < 12) {
    pushTitle(match[1]);
  }

  const genericHeadings = /<(?:h2|h3)[^>]*>([^<]{12,100})<\/(?:h2|h3)>/gi;
  while ((match = genericHeadings.exec(html)) !== null && drafts.length < 8) {
    const t = match[1];
    if (/property|sale|rent|condo|villa|house|apartment|borey|land/i.test(t)) {
      pushTitle(t);
    }
  }

  return drafts.slice(0, 8);
}

function extractFromRss(xml: string, sourceName: string, feedUrl: string, sourceId: string): AggregatedDraft[] {
  const drafts: AggregatedDraft[] = [];
  const itemRe = /<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?(?:<link>([^<]+)<\/link>)?[\s\S]*?<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && drafts.length < 10) {
    const title = m[1].replace(/<[^>]+>/g, "").trim();
    const link = m[2]?.trim() || feedUrl;
    if (title.length >= 8) {
      drafts.push(
        draftFromTitle(title, sourceName, link, sourceId, drafts.length, {
          description: `RSS item from ${sourceName}.`,
        }),
      );
    }
  }
  return drafts;
}

async function fetchText(url: string, signal: AbortSignal): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml,text/xml,*/*",
    },
    redirect: "follow",
    cache: "no-store",
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function discoverFeedUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkRe =
    /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/(?:rss\+xml|atom\+xml)["'][^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null && urls.length < 3) {
    try {
      urls.push(new URL(m[1], baseUrl).href);
    } catch {
      /* skip */
    }
  }
  try {
    const origin = new URL(baseUrl).origin;
    urls.push(`${origin}/feed/`, `${origin}/rss.xml`, `${origin}/feed/rss/`);
  } catch {
    /* skip */
  }
  return [...new Set(urls)];
}

/**
 * Heuristic poll: HTML headings, JSON-LD, RSS discovery. Never emits placeholder/fake listings.
 */
export async function fetchGenericSourceUrl(input: {
  sourceId: string;
  sourceName: string;
  listUrl: string;
}): Promise<GenericFetchOutcome> {
  const warnings: string[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const primary = await fetchText(input.listUrl, controller.signal);

    if (!primary.ok) {
      const blocked = primary.status === 403 || primary.status === 429;
      return {
        items: [],
        warnings: [`${input.sourceId}: HTTP ${primary.status}`],
        adapterNeeded: !blocked,
        status: blocked ? "blocked" : "fetch_error",
        message: blocked
          ? `Blocked or rate-limited (HTTP ${primary.status})`
          : `Fetch error (HTTP ${primary.status})`,
      };
    }

    if (looksBlocked(primary.text, primary.status)) {
      return {
        items: [],
        warnings: [`${input.sourceId}: bot wall or captcha detected`],
        adapterNeeded: true,
        status: "blocked",
        message: "Blocked — bot wall or captcha on HTML response",
      };
    }

    let items = extractFromHtml(primary.text, input.sourceName, input.listUrl, input.sourceId);

    if (items.length === 0) {
      const feeds = discoverFeedUrls(primary.text, input.listUrl);
      for (const feedUrl of feeds) {
        if (items.length > 0) break;
        try {
          const feed = await fetchText(feedUrl, controller.signal);
          if (feed.ok && feed.text.includes("<item")) {
            items = extractFromRss(feed.text, input.sourceName, feedUrl, input.sourceId);
            if (items.length > 0) {
              warnings.push(`${input.sourceId}: parsed ${items.length} item(s) from RSS`);
            }
          }
        } catch {
          /* try next feed */
        }
      }
    }

    if (items.length === 0) {
      return {
        items: [],
        warnings: [
          `${input.sourceId}: adapter needed — no listing headings, JSON-LD, or RSS items parsed`,
        ],
        adapterNeeded: true,
        status: "adapter_needed",
        message: "Adapter needed — HTML fetch did not yield listing cards",
      };
    }

    return {
      items,
      warnings,
      adapterNeeded: false,
      status: "ok",
      message: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      items: [],
      warnings: [`${input.sourceId}: ${msg}`],
      adapterNeeded: true,
      status: "fetch_error",
      message: isAbort ? "Fetch timed out" : `Fetch error — ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

#!/usr/bin/env node
/**
 * Parse Cambodia RE source catalog markdown → data/aggregation-sources.json
 * Usage: node scripts/build-aggregation-sources.mjs [path-to-md]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultMd =
  process.argv[2] ||
  "/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/docs/cambodia-re-sources-unique-links-full.md";

const SECTION_TYPE = {
  "1. Portals / aggregators": "portal",
  "2. Agencies / developers": "agency",
  "3. Facebook (groups, pages, marketplace, search)": "facebook",
  "4. Telegram": "telegram",
  "5. Other (YouTube, TikTok, forums, LinkedIn, apps, tools)": "other",
};

/** Canonical portal list URLs enabled for polling by default (top ~18). */
const DEFAULT_ENABLED_URLS = new Set(
  [
    "https://www.realestate.com.kh/buy",
    "https://www.khmer24.com/en/c-property-for-sale.html",
    "https://kh.fazwaz.com",
    "https://www.fazwaz.com/cambodia/for-sale",
    "https://www.bongthom.com/en/classifieds/property/houses-for-sale",
    "https://www.dotproperty.com.kh/en/for-sale",
    "https://www.propertyarea.asia/kh/buy",
    "https://www.propertyguru.com.kh/en/buy",
    "https://www.lamudi.com.kh",
    "https://propertyhub.com.kh/en/sale",
    "https://www.cambodia-property.com/buy",
    "https://www.properstar.com.kh/en/cambodia/buy",
    "https://www.rent.com.kh/sale",
    "https://www.homekh.com/en/sale",
    "https://www.pointerasia.com/property-for-sale",
    "https://www.khmerproperty.com.kh",
    "https://www.phnompenhrealestate.net/for-sale",
    "https://cambodia.dotproperty.com.kh",
    "https://www.sabay.com/property",
    "https://www.zillaproperty.asia",
    "https://www.housing.com.kh/en/buy",
  ].map(normalizeUrl),
);

/** Host → built-in HTML adapter id (one poll per host per sync batch). */
const HOST_ADAPTER = {
  "www.realestate.com.kh": "realestate-com-kh",
  "realestate.com.kh": "realestate-com-kh",
  "www.khmer24.com": "khmer24-property",
  "khmer24.com": "khmer24-property",
  "www.fazwaz.com": "fazwaz-kh",
  "fazwaz.com": "fazwaz-kh",
  "kh.fazwaz.com": "fazwaz-kh",
  "www.bongthom.com": "bongthom-property",
  "bongthom.com": "bongthom-property",
  "www.dotproperty.com.kh": "dotproperty-kh",
  "dotproperty.com.kh": "dotproperty-kh",
  "cambodia.dotproperty.com.kh": "dotproperty-kh",
  "www.propertyarea.asia": "propertyarea-kh",
  "propertyarea.asia": "propertyarea-kh",
  "www.propertyguru.com.kh": "propertyguru-kh",
  "propertyguru.com.kh": "propertyguru-kh",
  "www.lamudi.com.kh": "lamudi-kh",
  "lamudi.com.kh": "lamudi-kh",
  "propertyhub.com.kh": "propertyhub-kh",
  "www.propertyhub.com.kh": "propertyhub-kh",
  "www.cambodia-property.com": "cambodia-property",
  "cambodia-property.com": "cambodia-property",
  "www.homekh.com": "homekh",
  "homekh.com": "homekh",
  "www.rent.com.kh": "rent-com-kh",
  "rent.com.kh": "rent-com-kh",
  "www.pointerasia.com": "pointerasia",
  "pointerasia.com": "pointerasia",
  "www.khmerproperty.com.kh": "khmerproperty",
  "khmerproperty.com.kh": "khmerproperty",
  "www.phnompenhrealestate.net": "phnompenhrealestate",
  "phnompenhrealestate.net": "phnompenhrealestate",
  "www.housing.com.kh": "housing-com-kh",
  "housing.com.kh": "housing-com-kh",
  "www.properstar.com.kh": "properstar-kh",
  "properstar.com.kh": "properstar-kh",
  "www.zillaproperty.asia": "zillaproperty",
  "zillaproperty.asia": "zillaproperty",
};

function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return raw.trim();
  }
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").replace(/\./g, "-");
    const seg = u.pathname.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const base = seg ? `${host}-${seg}` : host;
    return base.toLowerCase().slice(0, 80);
  } catch {
    return url.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80);
  }
}

function parseMarkdown(md) {
  const lines = md.split("\n");
  let currentType = "other";
  const seen = new Set();
  const sources = [];

  for (const line of lines) {
    const section = line.match(/^## (.+)$/);
    if (section) {
      currentType = SECTION_TYPE[section[1]] ?? "other";
      continue;
    }
    const urlMatch = line.match(/^\d+\.\s+(https?:\/\/\S+)/);
    if (!urlMatch) continue;
    const url = normalizeUrl(urlMatch[1]);
    if (seen.has(url)) continue;
    seen.add(url);

    let hostname = "";
    try {
      hostname = new URL(url).hostname;
    } catch {
      /* keep empty */
    }

    const adapterId = HOST_ADAPTER[hostname] ?? null;
    /** All catalog rows enabled for registry sync; FB/TG get blocked status at poll time. */
    const enabled =
      currentType === "portal" ||
      currentType === "agency" ||
      currentType === "facebook" ||
      currentType === "telegram" ||
      currentType === "other";

    sources.push({
      id: slugFromUrl(url),
      name: hostname || url,
      url,
      type: currentType,
      enabled,
      adapterId,
    });
  }

  return sources;
}

function dedupeIds(sources) {
  const counts = new Map();
  return sources.map((s) => {
    const n = (counts.get(s.id) ?? 0) + 1;
    counts.set(s.id, n);
    if (n === 1) return s;
    return { ...s, id: `${s.id}-${n}` };
  });
}

const md = fs.readFileSync(defaultMd, "utf8");
let sources = dedupeIds(parseMarkdown(md));

const outPath = path.join(__dirname, "../src/data/aggregation-sources.json");
const payload = {
  generatedAt: new Date().toISOString(),
  sourceDocument: path.basename(defaultMd),
  total: sources.length,
  defaultEnabledCount: sources.filter((s) => s.enabled).length,
  defaultEnabledNote:
    "All 773 URLs enabled for batched sync; portals/agencies polled, social marked blocked/skipped",
  sources,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(
  `Wrote ${sources.length} sources (${payload.defaultEnabledCount} enabled) → ${outPath}`,
);

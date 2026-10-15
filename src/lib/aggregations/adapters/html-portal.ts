import type { AggregationAdapter, AggregatedDraft } from "./types";
import {
  fetchGenericSourceUrl,
  USER_AGENT,
} from "./generic-fetch";
import { sanitizeDescription } from "@/lib/aggregations/sanitize";

type PortalConfig = {
  id: string;
  label: string;
  sourceName: string;
  listUrl: string;
};

/** Dedicated list URLs for high-traffic Cambodia portals (shared adapter per host). */
const PORTALS: PortalConfig[] = [
  {
    id: "realestate-com-kh",
    label: "realestate.com.kh (HTML poll)",
    sourceName: "realestate.com.kh",
    listUrl: "https://www.realestate.com.kh/buy/",
  },
  {
    id: "khmer24-property",
    label: "khmer24 property (HTML poll)",
    sourceName: "khmer24.com",
    listUrl: "https://www.khmer24.com/en/c-property-for-sale.html",
  },
  {
    id: "fazwaz-kh",
    label: "FazWaz Cambodia",
    sourceName: "fazwaz.com",
    listUrl: "https://www.fazwaz.com/cambodia/for-sale",
  },
  {
    id: "bongthom-property",
    label: "BongThom property",
    sourceName: "bongthom.com",
    listUrl: "https://www.bongthom.com/en/classifieds/property/houses-for-sale",
  },
  {
    id: "dotproperty-kh",
    label: "DotProperty Cambodia",
    sourceName: "dotproperty.com.kh",
    listUrl: "https://www.dotproperty.com.kh/en/for-sale",
  },
  {
    id: "propertyarea-kh",
    label: "PropertyArea Cambodia",
    sourceName: "propertyarea.asia",
    listUrl: "https://www.propertyarea.asia/kh/buy",
  },
  {
    id: "propertyguru-kh",
    label: "PropertyGuru Cambodia",
    sourceName: "propertyguru.com.kh",
    listUrl: "https://www.propertyguru.com.kh/en/buy",
  },
  {
    id: "lamudi-kh",
    label: "Lamudi Cambodia",
    sourceName: "lamudi.com.kh",
    listUrl: "https://www.lamudi.com.kh",
  },
  {
    id: "propertyhub-kh",
    label: "PropertyHub Cambodia",
    sourceName: "propertyhub.com.kh",
    listUrl: "https://propertyhub.com.kh/en/sale",
  },
  {
    id: "cambodia-property",
    label: "Cambodia Property",
    sourceName: "cambodia-property.com",
    listUrl: "https://www.cambodia-property.com/buy",
  },
  {
    id: "homekh",
    label: "HomeKH",
    sourceName: "homekh.com",
    listUrl: "https://www.homekh.com/en/sale",
  },
  {
    id: "rent-com-kh",
    label: "Rent.com.kh sales",
    sourceName: "rent.com.kh",
    listUrl: "https://www.rent.com.kh/sale",
  },
  {
    id: "pointerasia",
    label: "Pointer Asia",
    sourceName: "pointerasia.com",
    listUrl: "https://www.pointerasia.com/property-for-sale",
  },
  {
    id: "khmerproperty",
    label: "Khmer Property",
    sourceName: "khmerproperty.com.kh",
    listUrl: "https://www.khmerproperty.com.kh",
  },
  {
    id: "phnompenhrealestate",
    label: "Phnom Penh Real Estate",
    sourceName: "phnompenhrealestate.net",
    listUrl: "https://www.phnompenhrealestate.net/for-sale",
  },
  {
    id: "housing-com-kh",
    label: "Housing.com.kh",
    sourceName: "housing.com.kh",
    listUrl: "https://www.housing.com.kh/en/buy",
  },
  {
    id: "properstar-kh",
    label: "Properstar Cambodia",
    sourceName: "properstar.com.kh",
    listUrl: "https://www.properstar.com.kh/en/cambodia/buy",
  },
  {
    id: "zillaproperty",
    label: "Zilla Property Asia",
    sourceName: "zillaproperty.asia",
    listUrl: "https://www.zillaproperty.asia",
  },
];

async function fetchPortal(portal: PortalConfig): Promise<{
  items: AggregatedDraft[];
  warnings: string[];
}> {
  const result = await fetchGenericSourceUrl({
    sourceId: portal.id,
    sourceName: portal.sourceName,
    listUrl: portal.listUrl,
  });
  return { items: result.items, warnings: result.warnings };
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

const portalById = new Map(PORTALS.map((p) => [p.id, p]));

/** Run a built-in portal adapter by id. */
export async function fetchKnownPortalAdapter(adapterId: string): Promise<{
  items: AggregatedDraft[];
  warnings: string[];
  status: "ok" | "adapter_needed" | "fetch_error" | "blocked";
  message: string | null;
}> {
  const portal = portalById.get(adapterId);
  if (!portal) {
    return {
      items: [],
      warnings: [`Unknown portal adapter id: ${adapterId}`],
      status: "adapter_needed",
      message: "Unknown dedicated adapter",
    };
  }
  const result = await fetchGenericSourceUrl({
    sourceId: portal.id,
    sourceName: portal.sourceName,
    listUrl: portal.listUrl,
  });
  return {
    items: result.items,
    warnings: result.warnings,
    status: result.status,
    message: result.message,
  };
}

/** @deprecated use fetchGenericSourceUrl from generic-fetch.ts */
export async function fetchGenericPortalUrl(input: {
  sourceId: string;
  sourceName: string;
  listUrl: string;
}) {
  const result = await fetchGenericSourceUrl(input);
  return {
    items: result.items,
    warnings: result.warnings,
    adapterNeeded: result.adapterNeeded,
    status: result.status,
    message: result.message,
  };
}

export { USER_AGENT, sanitizeDescription };

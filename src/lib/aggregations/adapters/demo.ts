import { photoUrl } from "@/lib/media";
import type { AggregationAdapter, AggregatedDraft } from "./types";

/**
 * Always-available demo adapter so Market Feed UI works end-to-end without
 * depending on fragile third-party HTML. Uses local SEAPS media only.
 */
function buildDemoDrafts(): AggregatedDraft[] {
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();

  return [
    {
      title: "2BR condo near BKK1 cafés",
      description:
        "Bright two-bedroom condo with balcony and updated kitchen. Walkable to Street 308 cafés. Aggregated demo listing for Market Feed.",
      price: 168000,
      currency: "USD",
      location: "Boeng Keng Kang 1, Phnom Penh",
      propertyType: "condo",
      photos: [
        photoUrl("photo-1502672260266-1c1ef2d93688"),
        photoUrl("photo-1560448204-e02f11c3d0e2"),
      ],
      publishedAt: iso(2),
      sourceName: "Demo Cambodia Portal",
      sourceUrl: "https://example.local/demo/condo-bkk1",
      contacts: {
        phone: "+855 12 345 678",
        email: "seller.demo@example.local",
        messenger: "Telegram @demo_pp_seller",
      },
      externalId: "demo:condo-bkk1-001",
    },
    {
      title: "Riverside duplex for rent — Tonle Bassac",
      description:
        "Furnished duplex with river breeze and covered parking. Monthly lease preferred. Demo adapter sample.",
      price: 1400,
      currency: "USD",
      location: "Tonle Bassac, Phnom Penh",
      propertyType: "apartment",
      photos: [
        photoUrl("photo-1522771739844-6a9f6d5f14af"),
        photoUrl("photo-1512917774080-9991f1c4c750"),
      ],
      publishedAt: iso(5),
      sourceName: "Demo Cambodia Portal",
      sourceUrl: "https://example.local/demo/rent-bassac",
      contacts: {
        phone: "+855 96 111 2233",
        messenger: "Facebook Messenger — Demo Agent",
      },
      externalId: "demo:rent-bassac-002",
    },
    {
      title: "Siem Reap townhouse near Wat Damnak",
      description:
        "Quiet three-bedroom townhouse with small garden. Suitable for long stay or family relocation. Demo sample.",
      price: 95000,
      currency: "USD",
      location: "Wat Damnak area, Siem Reap",
      propertyType: "townhouse",
      photos: [photoUrl("photo-1564013799919-ab600027ffc6")],
      publishedAt: iso(12),
      sourceName: "Khmer24 Demo Mirror",
      sourceUrl: "https://example.local/demo/sr-townhouse",
      contacts: {
        phone: "+855 15 888 001",
        email: "sr.owner@example.local",
      },
      externalId: "demo:sr-townhouse-003",
    },
    {
      title: "Sihanoukville land plot — Otres hillside",
      description:
        "Titled hillside plot with road access toward Otres. Demo aggregation entry — verify title with counsel before any offer.",
      price: 120000,
      currency: "USD",
      location: "Otres, Sihanoukville",
      propertyType: "land",
      photos: [photoUrl("photo-1500382017468-9049fed747ef")],
      publishedAt: iso(28),
      sourceName: "RealEstate.com.kh Demo Mirror",
      sourceUrl: "https://example.local/demo/otres-land",
      contacts: {
        phone: "+855 70 444 919",
        messenger: "WhatsApp +85570444919",
      },
      externalId: "demo:otres-land-004",
    },
    {
      title: "Shophouse retail front — Battambang",
      description:
        "Ground-floor retail with living quarters above. High street visibility. Demo Market Feed listing.",
      price: 210000,
      currency: "USD",
      location: "Central Battambang",
      propertyType: "retail",
      photos: [
        photoUrl("photo-1486406146926-c627a92ad1ab"),
        photoUrl("photo-1497366216548-37526070297c"),
      ],
      publishedAt: iso(40),
      sourceName: "Demo Cambodia Portal",
      sourceUrl: "https://example.local/demo/btb-shophouse",
      contacts: {
        email: "battambang.retail@example.local",
        phone: "+855 12 777 404",
      },
      externalId: "demo:btb-shophouse-005",
    },
    {
      title: "Serviced studio — BKK3 short stay",
      description:
        "Compact furnished studio with weekly cleaning option. Ideal for visiting consultants. Demo sample.",
      price: 45,
      currency: "USD",
      location: "Boeng Keng Kang 3, Phnom Penh",
      propertyType: "apartment",
      photos: [photoUrl("photo-1493809842364-78817add7ffb")],
      publishedAt: iso(8),
      sourceName: "Khmer24 Demo Mirror",
      sourceUrl: "https://example.local/demo/bkk3-studio",
      contacts: {
        messenger: "Telegram @bkk3_stays_demo",
        phone: "+855 11 222 333",
      },
      externalId: "demo:bkk3-studio-006",
    },
  ];
}

export const demoAdapter: AggregationAdapter = {
  id: "demo",
  label: "Demo market seed",
  async fetchDrafts() {
    return {
      adapterId: "demo",
      items: buildDemoDrafts(),
      warnings: [],
    };
  },
};

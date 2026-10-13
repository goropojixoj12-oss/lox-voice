import type { MarketStat } from "@/lib/types";

export const marketStats: MarketStat[] = [
  {
    id: "m1",
    label: "Median sale asking price",
    value: "$185k",
    change: "+1.4%",
    note: "Across published sale listings in Cambodia",
    demo: true,
  },
  {
    id: "m2",
    label: "Median price per m²",
    value: "$1,980",
    change: "+0.7%",
    note: "Composite from published sale stock",
    demo: true,
  },
  {
    id: "m3",
    label: "Median monthly rent",
    value: "$780",
    change: "-0.3%",
    note: "Long-term rentals across active cities",
    demo: true,
  },
  {
    id: "m4",
    label: "Active listing volume",
    value: "20",
    change: "+2",
    note: "Published properties currently on SEAPS",
    demo: true,
  },
  {
    id: "m5",
    label: "Popular districts",
    value: "BKK 1 · Daun Penh · Otres",
    change: "stable",
    note: "Based on inquiry concentration",
    demo: true,
  },
  {
    id: "m6",
    label: "Supply change (30 days)",
    value: "+8%",
    change: "rising",
    note: "New listings versus prior 30 days",
    demo: true,
  },
];

export const popularDistrictPrices = [
  { district: "BKK 1", city: "Phnom Penh", pricePerSqm: "$2,450 /m²", demo: true },
  { district: "Daun Penh", city: "Phnom Penh", pricePerSqm: "$2,200 /m²", demo: true },
  { district: "Toul Kork", city: "Phnom Penh", pricePerSqm: "$1,850 /m²", demo: true },
  { district: "Svay Dangkum", city: "Siem Reap", pricePerSqm: "$1,420 /m²", demo: true },
  { district: "Otres", city: "Sihanoukville", pricePerSqm: "$1,610 /m²", demo: true },
  { district: "Kampong Bay", city: "Kampot", pricePerSqm: "$980 /m²", demo: true },
];

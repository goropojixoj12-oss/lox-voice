import type { MarketStat } from "@/lib/types";

export const marketStats: MarketStat[] = [
  {
    id: "m1",
    label: "Median sale asking price",
    value: "$612k",
    change: "+1.8%",
    note: "Demo indicator across sample sale listings",
    demo: true,
  },
  {
    id: "m2",
    label: "Median price per m²",
    value: "$7,420",
    change: "+0.9%",
    note: "Demo composite from published sale stock",
    demo: true,
  },
  {
    id: "m3",
    label: "Median monthly rent",
    value: "$2,140",
    change: "-0.4%",
    note: "Demo indicator for long-term rentals",
    demo: true,
  },
  {
    id: "m4",
    label: "Active listing volume",
    value: "20",
    change: "+3",
    note: "Count of published demo properties",
    demo: true,
  },
  {
    id: "m5",
    label: "Popular districts",
    value: "Chiado · Marina · Eixample",
    change: "stable",
    note: "Based on demo inquiry concentration",
    demo: true,
  },
  {
    id: "m6",
    label: "Supply change (30 days)",
    value: "+12%",
    change: "sample",
    note: "Illustrative supply movement only",
    demo: true,
  },
];

export const popularDistrictPrices = [
  { district: "Chiado", city: "Lisbon", pricePerSqm: "$7,450 /m²", demo: true },
  { district: "Dubai Marina", city: "Dubai", pricePerSqm: "$13,050 /m²", demo: true },
  { district: "Eixample", city: "Barcelona", pricePerSqm: "$6,980 /m²", demo: true },
  { district: "Orchard", city: "Singapore", pricePerSqm: "$18,200 /m²", demo: true },
  { district: "Polanco", city: "Mexico City", pricePerSqm: "$6,310 /m²", demo: true },
  { district: "Camps Bay", city: "Cape Town", pricePerSqm: "$4,280 /m²", demo: true },
];

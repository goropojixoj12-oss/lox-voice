import type { CityGuide } from "@/lib/types";

export const cities: CityGuide[] = [
  {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
    listingCount: 86,
    blurb: "Riverfront apartments, tiled façades, and strong long-stay demand.",
    districts: [
      {
        slug: "alfama",
        name: "Alfama",
        listingCount: 18,
        image:
          "https://images.unsplash.com/photo-1585208798174-6cedd86e968a?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "chiado",
        name: "Chiado",
        listingCount: 22,
        image:
          "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "parque-das-nacoes",
        name: "Parque das Nações",
        listingCount: 16,
        image:
          "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=80",
    listingCount: 74,
    blurb: "Mediterranean living with design-led apartments and coastal villas.",
    districts: [
      {
        slug: "eixample",
        name: "Eixample",
        listingCount: 24,
        image:
          "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "gracia",
        name: "Gràcia",
        listingCount: 19,
        image:
          "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "poblenou",
        name: "Poblenou",
        listingCount: 15,
        image:
          "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
    listingCount: 112,
    blurb: "High-rise residences, waterfront towers, and investor-ready stock.",
    districts: [
      {
        slug: "marina",
        name: "Dubai Marina",
        listingCount: 34,
        image:
          "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "downtown",
        name: "Downtown",
        listingCount: 28,
        image:
          "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "palm-jumeirah",
        name: "Palm Jumeirah",
        listingCount: 21,
        image:
          "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    slug: "singapore",
    name: "Singapore",
    country: "Singapore",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
    listingCount: 61,
    blurb: "Efficient urban homes with strong rental fundamentals.",
    districts: [
      {
        slug: "orchard",
        name: "Orchard",
        listingCount: 14,
        image:
          "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "tanjong-pagar",
        name: "Tanjong Pagar",
        listingCount: 17,
        image:
          "https://images.unsplash.com/photo-1496939376851-023ee8753335?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    slug: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    image:
      "https://images.unsplash.com/photo-1518659526054-1798dd90db65?auto=format&fit=crop&w=1600&q=80",
    listingCount: 58,
    blurb: "Creative neighborhoods, courtyards, and growing commercial corridors.",
    districts: [
      {
        slug: "roma-norte",
        name: "Roma Norte",
        listingCount: 20,
        image:
          "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "polanco",
        name: "Polanco",
        listingCount: 18,
        image:
          "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    slug: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80",
    listingCount: 49,
    blurb: "Mountain views, coastal villas, and lifestyle-driven rentals.",
    districts: [
      {
        slug: "sea-point",
        name: "Sea Point",
        listingCount: 12,
        image:
          "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb6d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "camps-bay",
        name: "Camps Bay",
        listingCount: 11,
        image:
          "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug);
}

export function getDistrict(citySlug: string, districtSlug: string) {
  const city = getCity(citySlug);
  return city?.districts.find((d) => d.slug === districtSlug);
}

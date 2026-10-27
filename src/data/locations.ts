import type { CityGuide } from "@/lib/types";
import { photoUrl } from "@/lib/media";

const img = (id: string, w = 1600) => photoUrl(id, w);

export const cities: CityGuide[] = [
  {
    slug: "phnom-penh",
    name: "Phnom Penh",
    country: "Cambodia",
    image: img("photo-1552465011-b4e21bf6e79a"),
    listingCount: 128,
    blurb: "Capital apartments, riverside homes, and commercial corridors across the city.",
    districts: [
      {
        slug: "bkk-1",
        name: "BKK 1",
        listingCount: 34,
        image: img("photo-1545324418-cc1a3fa10c00", 1200),
      },
      {
        slug: "toul-kork",
        name: "Toul Kork",
        listingCount: 22,
        image: img("photo-1486406146926-c627a92ad1ab", 1200),
      },
      {
        slug: "daun-penh",
        name: "Daun Penh",
        listingCount: 28,
        image: img("photo-1512917774080-9991f1c4c750", 1200),
      },
      {
        slug: "chamkarmon",
        name: "Chamkarmon",
        listingCount: 19,
        image: img("photo-1560448204-e02f11c3d0e2", 1200),
      },
      {
        slug: "meanchey",
        name: "Meanchey",
        listingCount: 12,
        image: img("photo-1586528116311-ad8dd3c8310d", 1200),
      },
      {
        slug: "chroy-changvar",
        name: "Chroy Changvar",
        listingCount: 11,
        image: img("photo-1500382017468-9049fed747ef", 1200),
      },
      {
        slug: "sen-sok",
        name: "Sen Sok",
        listingCount: 14,
        image: img("photo-1536376072261-38c75010e6c9", 1200),
      },
    ],
  },
  {
    slug: "siem-reap",
    name: "Siem Reap",
    country: "Cambodia",
    image: img("photo-1528183429752-a97d14bf51b1"),
    listingCount: 64,
    blurb: "Villas, boutique residences, and investment stock near the temple belt.",
    districts: [
      {
        slug: "svay-dangkum",
        name: "Svay Dangkum",
        listingCount: 18,
        image: img("photo-1600596542815-ffad4c1539a9", 1200),
      },
      {
        slug: "sala-kamraeuk",
        name: "Sala Kamraeuk",
        listingCount: 15,
        image: img("photo-1600585154340-be6161a56a0c", 1200),
      },
      {
        slug: "sla-kram",
        name: "Sla Kram",
        listingCount: 12,
        image: img("photo-1600607687939-ce8a6c25118c", 1200),
      },
    ],
  },
  {
    slug: "sihanoukville",
    name: "Sihanoukville",
    country: "Cambodia",
    image: img("photo-1507525428034-b723cf961d3e"),
    listingCount: 41,
    blurb: "Coastal condos, beachfront rentals, and waterfront commercial space.",
    districts: [
      {
        slug: "otres",
        name: "Otres",
        listingCount: 14,
        image: img("photo-1512917774080-9991f1c4c750", 1200),
      },
      {
        slug: "sangkat-bei",
        name: "Sangkat Bei",
        listingCount: 11,
        image: img("photo-1545324418-cc1a3fa10c00", 1200),
      },
    ],
  },
  {
    slug: "battambang",
    name: "Battambang",
    country: "Cambodia",
    image: img("photo-1555881400-74d7acaacd8b"),
    listingCount: 27,
    blurb: "Provincial homes, shopfronts, and quieter residential streets.",
    districts: [
      {
        slug: "svay-por",
        name: "Svay Por",
        listingCount: 10,
        image: img("photo-1564013799919-ab600027ffc6", 1200),
      },
    ],
  },
  {
    slug: "kampot",
    name: "Kampot",
    country: "Cambodia",
    image: img("photo-1506905925346-21bda4d32df4"),
    listingCount: 22,
    blurb: "Riverfront houses and lifestyle rentals along the Kampot waterfront.",
    districts: [
      {
        slug: "kampong-bay",
        name: "Kampong Bay",
        listingCount: 9,
        image: img("photo-1605276374104-dee2a0ed3cd6", 1200),
      },
    ],
  },
  {
    slug: "kep",
    name: "Kep",
    country: "Cambodia",
    image: img("photo-1476514525535-07fb3b4ae5f1"),
    listingCount: 16,
    blurb: "Coastal retreats and weekend homes overlooking the Kep shoreline.",
    districts: [
      {
        slug: "prey-thom",
        name: "Prey Thom",
        listingCount: 7,
        image: img("photo-1613490493576-7fde63acd811", 1200),
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

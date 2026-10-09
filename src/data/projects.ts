import type { DevelopmentProject } from "@/lib/types";

export const projects: DevelopmentProject[] = [
  {
    id: "proj-nova-quay",
    slug: "nova-quay",
    name: "Nova Quay",
    developer: "Lumen Urban Works",
    summary: "Riverfront residences with pavilion gardens and resident work lounges.",
    description:
      "Nova Quay is a mid-rise waterfront community combining residential floors with shared gardens and quiet work lounges. The masterplan prioritizes shaded walkways and ground-level retail for daily needs.",
    images: [
      {
        id: "nq1",
        url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
        alt: "Nova Quay exterior concept",
        isCover: true,
      },
      {
        id: "nq2",
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80",
        alt: "Lobby atmosphere",
      },
    ],
    location: {
      country: "Portugal",
      countrySlug: "portugal",
      city: "Lisbon",
      citySlug: "lisbon",
      district: "Parque das Nações",
      districtSlug: "parque-das-nacoes",
      address: "Nova Quay waterfront",
      lat: 38.7655,
      lng: -9.0955,
    },
    priceFrom: 420000,
    priceTo: 890000,
    currency: "EUR",
    completionDate: "2028-06-01",
    constructionStage: "structure",
    amenities: ["parking", "gym", "garden", "security", "elevator", "workspace"],
    unitTypes: ["1-bed", "2-bed", "3-bed"],
    areasFrom: 48,
    areasTo: 142,
    verifiedFacts: [
      "Construction stage listed as structure based on developer progress notes shared for demo.",
      "Unit inventory shown on EstateNova is a demonstration subset.",
    ],
    developerClaims: [
      "Developer materials claim completion in mid-2028.",
      "Shared amenities and finishes are described by the developer and may change.",
    ],
    unitIds: ["p-017"],
    brochureUrl: undefined,
  },
  {
    id: "proj-marina-crest",
    slug: "marina-crest",
    name: "Marina Crest",
    developer: "Harborline Developments",
    summary: "Harbor tower residences with sky lounge and wellness deck.",
    description:
      "Marina Crest targets buyers seeking vertical living with marina orientation. Floors are planned around efficient three-bedroom layouts and shared wellness amenities.",
    images: [
      {
        id: "mc1",
        url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
        alt: "Marina Crest skyline context",
        isCover: true,
      },
      {
        id: "mc2",
        url: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1600&q=80",
        alt: "Interior finish mood",
      },
    ],
    location: {
      country: "UAE",
      countrySlug: "uae",
      city: "Dubai",
      citySlug: "dubai",
      district: "Dubai Marina",
      districtSlug: "marina",
      address: "Marina Crest tower",
      lat: 25.086,
      lng: 55.147,
    },
    priceFrom: 1450000,
    priceTo: 3200000,
    currency: "AED",
    completionDate: "2027-11-01",
    constructionStage: "finishing",
    amenities: ["parking", "pool", "gym", "elevator", "security", "sea_view"],
    unitTypes: ["2-bed", "3-bed", "penthouse"],
    areasFrom: 98,
    areasTo: 310,
    verifiedFacts: [
      "Demonstration project used to exercise off-plan browsing flows.",
      "Shown units are sample inventory only.",
    ],
    developerClaims: [
      "Developer brochure claims sky lounge access for all residences.",
      "Payment plan details require direct developer confirmation.",
    ],
    unitIds: ["p-018"],
  },
  {
    id: "proj-verde-courts",
    slug: "verde-courts",
    name: "Verde Courts",
    developer: "Barcino Living",
    summary: "Courtyard townhomes near Gràcia with shared gardens.",
    description:
      "Verde Courts is a low-rise courtyard community designed for families seeking quieter streets with access to Barcelona’s neighborhood fabric.",
    images: [
      {
        id: "vc1",
        url: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1600&q=80",
        alt: "Courtyard townhomes",
        isCover: true,
      },
    ],
    location: {
      country: "Spain",
      countrySlug: "spain",
      city: "Barcelona",
      citySlug: "barcelona",
      district: "Gràcia",
      districtSlug: "gracia",
      address: "Gràcia courtyard block",
      lat: 41.405,
      lng: 2.155,
    },
    priceFrom: 780000,
    priceTo: 1350000,
    currency: "EUR",
    completionDate: "2027-04-01",
    constructionStage: "foundation",
    amenities: ["garden", "parking", "terrace", "pet_friendly"],
    unitTypes: ["townhouse 3-bed", "townhouse 4-bed"],
    areasFrom: 140,
    areasTo: 210,
    verifiedFacts: ["Foundation stage shown as demo construction status."],
    developerClaims: ["Developer claims shared courtyard completion before first handover."],
    unitIds: [],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getProjectById(id: string) {
  return projects.find((p) => p.id === id);
}

import type { DevelopmentProject } from "@/lib/types";
import { photoImage } from "@/lib/media";

const img = (id: string, alt: string, cover = false) => ({
  ...photoImage(id, alt),
  isCover: cover || undefined,
});

export const projects: DevelopmentProject[] = [
  {
    id: "proj-tonle-bassac",
    slug: "tonle-bassac-residences",
    name: "Tonle Bassac Residences",
    developer: "SEAPS Developments",
    summary: "Mid-rise residences near Tonle Bassac with shared gardens and resident lounges.",
    description:
      "Tonle Bassac Residences combines residential floors with shaded walkways and ground-level retail for daily needs in central Phnom Penh.",
    images: [
      img("photo-1486406146926-c627a92ad1ab", "Tonle Bassac Residences exterior", true),
      img("photo-1545324418-cc1a3fa10c00", "Lobby atmosphere"),
    ],
    location: {
      country: "Cambodia",
      countrySlug: "cambodia",
      city: "Phnom Penh",
      citySlug: "phnom-penh",
      district: "Chamkarmon",
      districtSlug: "chamkarmon",
      address: "Tonle Bassac area",
      lat: 11.545,
      lng: 104.928,
    },
    priceFrom: 98000,
    priceTo: 265000,
    currency: "USD",
    completionDate: "2027-09-01",
    constructionStage: "structure",
    amenities: ["parking", "gym", "garden", "security", "elevator", "pool"],
    unitTypes: ["1-bed", "2-bed", "3-bed"],
    areasFrom: 42,
    areasTo: 128,
    verifiedFacts: [
      "Construction stage listed as structure based on developer progress notes.",
      "Unit inventory shown on SEAPS is a current published subset.",
    ],
    developerClaims: [
      "Developer materials claim completion in late 2027.",
      "Shared amenities and finishes are described by the developer and may change.",
    ],
    unitIds: ["p-017"],
  },
  {
    id: "proj-angkor-green",
    slug: "angkor-green-courts",
    name: "Angkor Green Courts",
    developer: "SEAPS Developments",
    summary: "Courtyard villas in Sala Kamraeuk with shared gardens and compound security.",
    description:
      "Angkor Green Courts is a low-rise villa community designed for families seeking quieter streets with access to Siem Reap amenities.",
    images: [
      img("photo-1605276374104-dee2a0ed3cd6", "Angkor Green Courts villas", true),
      img("photo-1600596542815-ffad4c1539a9", "Garden court"),
    ],
    location: {
      country: "Cambodia",
      countrySlug: "cambodia",
      city: "Siem Reap",
      citySlug: "siem-reap",
      district: "Sala Kamraeuk",
      districtSlug: "sala-kamraeuk",
      address: "Angkor Green Courts",
      lat: 13.365,
      lng: 103.865,
    },
    priceFrom: 195000,
    priceTo: 320000,
    currency: "USD",
    completionDate: "2027-04-01",
    constructionStage: "finishing",
    amenities: ["garden", "parking", "pool", "security"],
    unitTypes: ["villa 2-bed", "villa 3-bed"],
    areasFrom: 120,
    areasTo: 210,
    verifiedFacts: ["Finishing stage confirmed from latest site progress update."],
    developerClaims: ["Developer claims shared courtyard completion before first handover."],
    unitIds: ["p-018"],
  },
  {
    id: "proj-otres-horizon",
    slug: "otres-horizon",
    name: "Otres Horizon",
    developer: "SEAPS Developments",
    summary: "Coastal residences above Otres with sea-oriented balconies.",
    description:
      "Otres Horizon targets buyers seeking coastal living with managed building services and short travel time to Otres beaches.",
    images: [img("photo-1512917774080-9991f1c4c750", "Otres Horizon coastal residence", true)],
    location: {
      country: "Cambodia",
      countrySlug: "cambodia",
      city: "Sihanoukville",
      citySlug: "sihanoukville",
      district: "Otres",
      districtSlug: "otres",
      address: "Otres beach ridge",
      lat: 10.572,
      lng: 103.548,
    },
    priceFrom: 85000,
    priceTo: 210000,
    currency: "USD",
    completionDate: "2028-02-01",
    constructionStage: "foundation",
    amenities: ["parking", "pool", "gym", "security", "sea_view"],
    unitTypes: ["studio", "1-bed", "2-bed"],
    areasFrom: 35,
    areasTo: 95,
    verifiedFacts: ["Foundation stage listed from developer construction notes."],
    developerClaims: ["Developer brochure claims sea views from most upper floors."],
    unitIds: [],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getProjectById(id: string) {
  return projects.find((p) => p.id === id);
}

import type { Agency, Agent } from "@/lib/types";

export const agencies: Agency[] = [
  {
    id: "ag-atlas",
    slug: "atlas-habitat",
    name: "Atlas Habitat",
    logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80",
    cover:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    description:
      "Atlas Habitat specializes in design-forward homes across Southern Europe with bilingual advisory for relocating buyers.",
    city: "Lisbon",
    citySlug: "lisbon",
    districts: ["Chiado", "Alfama", "Parque das Nações"],
    specializations: ["Apartments", "Investment", "Relocation"],
    verified: true,
    agentIds: ["agent-maya", "agent-rui"],
    propertyCount: 24,
    foundedYear: 2014,
    languages: ["English", "Portuguese", "French"],
  },
  {
    id: "ag-harbor",
    slug: "harborline-realty",
    name: "Harborline Realty",
    logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80",
    cover:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80",
    description:
      "Waterfront specialists covering Dubai Marina, Downtown, and Palm residences for end-users and portfolio investors.",
    city: "Dubai",
    citySlug: "dubai",
    districts: ["Dubai Marina", "Downtown", "Palm Jumeirah"],
    specializations: ["Luxury", "Off-plan", "Short stay"],
    verified: true,
    agentIds: ["agent-lena", "agent-omar"],
    propertyCount: 41,
    foundedYear: 2011,
    languages: ["English", "Arabic", "Russian"],
  },
  {
    id: "ag-verde",
    slug: "verde-urban",
    name: "Verde Urban",
    logo: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=200&q=80",
    cover:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    description:
      "Neighborhood-first brokerage in Barcelona focused on mid-market apartments and boutique commercial spaces.",
    city: "Barcelona",
    citySlug: "barcelona",
    districts: ["Eixample", "Gràcia", "Poblenou"],
    specializations: ["Rentals", "Commercial", "Townhouses"],
    verified: true,
    agentIds: ["agent-ines"],
    propertyCount: 19,
    foundedYear: 2018,
    languages: ["English", "Spanish", "Catalan"],
  },
  {
    id: "ag-pacific",
    slug: "pacific-key",
    name: "Pacific Key Advisors",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80",
    cover:
      "https://images.unsplash.com/photo-1449844908441-8829872d1727?auto=format&fit=crop&w=1600&q=80",
    description:
      "Singapore-based advisors for condominiums, office suites, and cross-border investors seeking stable yield.",
    city: "Singapore",
    citySlug: "singapore",
    districts: ["Orchard", "Tanjong Pagar"],
    specializations: ["Condos", "Office", "Yield analysis"],
    verified: false,
    agentIds: ["agent-jun"],
    propertyCount: 12,
    foundedYear: 2020,
    languages: ["English", "Mandarin"],
  },
];

export const agents: Agent[] = [
  {
    id: "agent-maya",
    slug: "maya-ferreira",
    name: "Maya Ferreira",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    title: "Senior Buyer Advisor",
    bio: "Maya helps international families find calm, well-located homes in central Lisbon.",
    agencyId: "ag-atlas",
    languages: ["English", "Portuguese"],
    specializations: ["Family homes", "Historic apartments"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-rui",
    slug: "rui-costa",
    name: "Rui Costa",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    title: "Investment Specialist",
    bio: "Rui focuses on yield-oriented apartments near transit corridors and university districts.",
    agencyId: "ag-atlas",
    languages: ["English", "Portuguese", "Spanish"],
    specializations: ["Investment", "Rentals"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-lena",
    slug: "lena-kovacs",
    name: "Lena Kovacs",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    title: "Luxury Residences Lead",
    bio: "Lena curates high-floor marina and downtown residences for relocating executives.",
    agencyId: "ag-harbor",
    languages: ["English", "Russian", "German"],
    specializations: ["Luxury", "Waterfront"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-omar",
    slug: "omar-hassan",
    name: "Omar Hassan",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    title: "Off-plan Consultant",
    bio: "Omar guides buyers through developer projects with transparent stage and payment timelines.",
    agencyId: "ag-harbor",
    languages: ["English", "Arabic"],
    specializations: ["Off-plan", "Developer sales"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-ines",
    slug: "ines-valles",
    name: "Inés Vallès",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    title: "Neighborhood Broker",
    bio: "Inés knows Eixample and Gràcia street by street and prioritizes walkable living.",
    agencyId: "ag-verde",
    languages: ["English", "Spanish", "Catalan"],
    specializations: ["Apartments", "Long-term rent"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-jun",
    slug: "jun-wei",
    name: "Jun Wei",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    title: "Corporate Housing Advisor",
    bio: "Jun supports companies placing staff in Singapore with clear lease terms and amenity briefings.",
    agencyId: "ag-pacific",
    languages: ["English", "Mandarin"],
    specializations: ["Corporate lease", "Condos"],
    verified: false,
    propertyIds: [],
  },
];

export function getAgency(slug: string) {
  return agencies.find((a) => a.slug === slug);
}

export function getAgencyById(id: string) {
  return agencies.find((a) => a.id === id);
}

export function getAgent(slug: string) {
  return agents.find((a) => a.slug === slug);
}

export function getAgentById(id: string) {
  return agents.find((a) => a.id === id);
}

export function getAgentsByAgency(agencyId: string) {
  return agents.filter((a) => a.agencyId === agencyId);
}

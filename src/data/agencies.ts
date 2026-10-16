import type { Agency, Agent } from "@/lib/types";
import { photoUrl } from "@/lib/media";

const img = (id: string, w = 1600) => photoUrl(id, w);

/** SEAPS regional desks — no third-party brokerage names on public pages. */
export const agencies: Agency[] = [
  {
    id: "ag-mekong",
    slug: "seaps-phnom-penh",
    name: "SEAPS Phnom Penh",
    logo: img("photo-1486406146926-c627a92ad1ab", 200),
    cover: img("photo-1545324418-cc1a3fa10c00"),
    description:
      "SEAPS desk for serviced apartments, family villas, and relocation housing across BKK 1, Chamkarmon, and Toul Kork.",
    city: "Phnom Penh",
    citySlug: "phnom-penh",
    districts: ["BKK 1", "Chamkarmon", "Toul Kork"],
    specializations: ["Apartments", "Relocation", "Long-term rent"],
    verified: true,
    agentIds: ["agent-sokha", "agent-dara"],
    propertyCount: 36,
    foundedYear: 1997,
    languages: ["English", "Khmer", "Chinese"],
  },
  {
    id: "ag-angkor",
    slug: "seaps-siem-reap",
    name: "SEAPS Siem Reap",
    logo: img("photo-1528183429752-a97d14bf51b1", 200),
    cover: img("photo-1600596542815-ffad4c1539a9"),
    description:
      "SEAPS desk for villas, boutique residences, and hospitality-linked homes near Svay Dangkum and Sala Kamraeuk.",
    city: "Siem Reap",
    citySlug: "siem-reap",
    districts: ["Svay Dangkum", "Sala Kamraeuk", "Sla Kram"],
    specializations: ["Villas", "Investment", "Short stay"],
    verified: true,
    agentIds: ["agent-rith", "agent-srey"],
    propertyCount: 24,
    foundedYear: 1997,
    languages: ["English", "Khmer", "French"],
  },
  {
    id: "ag-tonle",
    slug: "seaps-coastal",
    name: "SEAPS Coastal",
    logo: img("photo-1497366216548-37526070297c", 200),
    cover: img("photo-1512917774080-9991f1c4c750"),
    description:
      "SEAPS coastal desk covering Sihanoukville, Kampot, and Kep for lifestyle buyers and seasonal rentals.",
    city: "Sihanoukville",
    citySlug: "sihanoukville",
    districts: ["Otres", "Sangkat Bei"],
    specializations: ["Coastal", "Commercial", "Land"],
    verified: true,
    agentIds: ["agent-vann"],
    propertyCount: 18,
    foundedYear: 1997,
    languages: ["English", "Khmer"],
  },
  {
    id: "ag-royal",
    slug: "seaps-commercial",
    name: "SEAPS Commercial",
    logo: img("photo-1486406146926-c627a92ad1ab", 200),
    cover: img("photo-1560518883-ce09059eeffa"),
    description:
      "SEAPS commercial desk for office floors, shopfronts, and mid-market homes in Phnom Penh and Battambang.",
    city: "Phnom Penh",
    citySlug: "phnom-penh",
    districts: ["Daun Penh", "Meanchey"],
    specializations: ["Commercial", "Shophouses", "Yield analysis"],
    verified: true,
    agentIds: ["agent-chenda"],
    propertyCount: 21,
    foundedYear: 1997,
    languages: ["English", "Khmer", "Vietnamese"],
  },
];

export const agents: Agent[] = [
  {
    id: "agent-sokha",
    slug: "sokha-meas",
    name: "Adam James",
    photo: img("photo-1573496359142-b8d87734a5a2", 600),
    title: "Senior Buyer Advisor",
    bio: "Adam James helps relocating families find secure, walkable homes in central Phnom Penh with SEAPS.",
    agencyId: "ag-mekong",
    languages: ["English", "Khmer"],
    specializations: ["Family homes", "Serviced apartments"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-dara",
    slug: "dara-kim",
    name: "Adam James",
    photo: img("photo-1472099645785-5658abf4ff4e", 600),
    title: "Investment Specialist",
    bio: "Adam James focuses on rental yield and condo stock near transit and business districts for SEAPS clients.",
    agencyId: "ag-mekong",
    languages: ["English", "Khmer", "Chinese"],
    specializations: ["Investment", "Condos"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-rith",
    slug: "rith-chan",
    name: "Adam James",
    photo: img("photo-1507003211169-0a1dd7228f2d", 600),
    title: "Villa Specialist",
    bio: "Adam James covers villa compounds and private residences across Siem Reap for SEAPS.",
    agencyId: "ag-angkor",
    languages: ["English", "Khmer"],
    specializations: ["Villas", "Off-plan"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-srey",
    slug: "srey-poon",
    name: "Adam James",
    photo: img("photo-1580489944761-15a19d654956", 600),
    title: "Hospitality Residences Lead",
    bio: "Adam James advises on short-stay and boutique residences close to the Old Market area with SEAPS.",
    agencyId: "ag-angkor",
    languages: ["English", "Khmer", "French"],
    specializations: ["Short stay", "Boutique homes"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-vann",
    slug: "vann-sok",
    name: "Adam James",
    photo: img("photo-1500648767791-00dcc994a43e", 600),
    title: "Coastal Property Advisor",
    bio: "Adam James works Otres and Sangkat Bei inventory for coastal living and shopfront leases via SEAPS.",
    agencyId: "ag-tonle",
    languages: ["English", "Khmer"],
    specializations: ["Coastal", "Commercial"],
    verified: true,
    propertyIds: [],
  },
  {
    id: "agent-chenda",
    slug: "chenda-ly",
    name: "Adam James",
    photo: img("photo-1544005313-94ddf0286df2", 600),
    title: "Commercial Advisor",
    bio: "Adam James places offices and shophouses for growing Cambodian businesses in Daun Penh with SEAPS.",
    agencyId: "ag-royal",
    languages: ["English", "Khmer"],
    specializations: ["Office", "Retail"],
    verified: true,
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

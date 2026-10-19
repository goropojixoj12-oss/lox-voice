export type UserRole =
  | "guest"
  | "buyer"
  | "owner"
  | "agent"
  | "admin";

export type TransactionType = "sale" | "rent" | "short_stay";

export type PropertyType =
  | "apartment"
  | "condo"
  | "house"
  | "villa"
  | "townhouse"
  | "commercial"
  | "office"
  | "retail"
  | "warehouse"
  | "land"
  | "project_unit";

export type ListingStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "archived";

export type VerificationStatus = "unverified" | "verified" | "premium";

export type SellerType = "owner" | "agent" | "developer";

export type Furnishing = "unfurnished" | "semi" | "furnished";

export type AmenityKey =
  | "parking"
  | "pool"
  | "elevator"
  | "balcony"
  | "terrace"
  | "garden"
  | "gym"
  | "security"
  | "air_conditioning"
  | "sea_view"
  | "pet_friendly"
  | "workspace";

export interface LocationRef {
  country: string;
  countrySlug: string;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  commune?: string;
  communeSlug?: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isCover?: boolean;
}

export interface PropertyVideo {
  id: string;
  url: string;
  label?: string;
  /** card_preview = autoplay loop on listing cards */
  role?: "tour" | "card_preview";
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  status: ListingStatus;
  verification: VerificationStatus;
  sellerType: SellerType;
  price: number;
  currency: string;
  pricePeriod: "month" | "night" | "year" | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  landSqm: number | null;
  furnishing: Furnishing | null;
  amenities: AmenityKey[];
  images: PropertyImage[];
  videos?: PropertyVideo[];
  cardPreviewVideoUrl?: string | null;
  location: LocationRef;
  agentId?: string;
  agencyId?: string;
  ownerId?: string;
  projectId?: string;
  publishedAt: string;
  updatedAt: string;
  hasVideoTour?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  demo?: boolean;
  views?: number;
  inquiries?: number;
}

export interface Agency {
  id: string;
  slug: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  city: string;
  citySlug: string;
  districts: string[];
  specializations: string[];
  verified: boolean;
  agentIds: string[];
  propertyCount: number;
  foundedYear: number;
  languages: string[];
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  photo: string;
  /** Demo/platform login user linked to this public agent profile. */
  platformUserId?: string;
  title: string;
  bio: string;
  agencyId: string;
  languages: string[];
  specializations: string[];
  verified: boolean;
  propertyIds: string[];
}

export interface DevelopmentProject {
  id: string;
  slug: string;
  name: string;
  developer: string;
  summary: string;
  description: string;
  images: PropertyImage[];
  location: LocationRef;
  priceFrom: number;
  priceTo: number;
  currency: string;
  completionDate: string;
  constructionStage: "planning" | "foundation" | "structure" | "finishing" | "ready";
  amenities: AmenityKey[];
  unitTypes: string[];
  areasFrom: number;
  areasTo: number;
  verifiedFacts: string[];
  developerClaims: string[];
  unitIds: string[];
  brochureUrl?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: "news" | "guides" | "analysis" | "city" | "district" | "investor";
  author: string;
  publishedAt: string;
  relatedPropertyIds?: string[];
  relatedCitySlug?: string;
}

export interface MarketStat {
  id: string;
  label: string;
  value: string;
  change: string;
  note: string;
  demo: true;
}

export interface CityGuide {
  slug: string;
  name: string;
  country: string;
  image: string;
  listingCount: number;
  blurb: string;
  districts: { slug: string; name: string; listingCount: number; image: string }[];
}

export interface DemoUser {
  id: string;
  email: string;
  /** bcrypt hash — never store plaintext passwords. */
  passwordHash: string;
  name: string;
  role: Exclude<UserRole, "guest">;
  agencyId?: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  contact: string;
  message: string;
  status: "new" | "in_progress" | "closed";
  createdAt: string;
  recipientType: "agent" | "owner" | "platform";
}

export interface SavedSearch {
  id: string;
  name: string;
  params: Record<string, string>;
  createdAt: string;
}

/** Contacts from an external market source — admin-only on the public site. */
export interface AggregatedContacts {
  phone?: string;
  email?: string;
  messenger?: string;
}

/**
 * Listing ingested from an external Cambodia market source (portal scrape,
 * manual paste, or future FB/TG connector). Sensitive fields stay in storage
 * but must never appear on public API/UI responses.
 */
export interface AggregatedListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  location: string | null;
  propertyType: PropertyType | null;
  photos: string[];
  publishedAt: string | null;
  sourceName: string;
  sourceUrl: string | null;
  contacts: AggregatedContacts;
  externalId: string;
  createdAt: string;
  updatedAt: string;
}

/** Public-safe projection — no contacts, no source identity. */
export type PublicAggregatedListing = Omit<
  AggregatedListing,
  "sourceName" | "sourceUrl" | "contacts"
>;

export interface SearchFilters {
  q?: string;
  deal?: TransactionType | "all";
  city?: string;
  district?: string;
  type?: PropertyType | "all";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  minLand?: number;
  furnishing?: Furnishing | "all";
  amenities?: AmenityKey[];
  verification?: VerificationStatus | "all";
  sellerType?: SellerType | "all";
  publishedWithinDays?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc" | "relevance";
  page?: number;
  pageSize?: number;
  premium?: boolean;
  featured?: boolean;
  hasVideo?: boolean;
}

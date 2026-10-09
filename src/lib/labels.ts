import type {
  AmenityKey,
  Furnishing,
  PropertyType,
  TransactionType,
  VerificationStatus,
} from "@/lib/types";

export const transactionLabels: Record<TransactionType, string> = {
  sale: "For sale",
  rent: "For rent",
  short_stay: "Short stay",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Apartment",
  condo: "Condo",
  house: "House",
  villa: "Villa",
  townhouse: "Townhouse",
  commercial: "Commercial",
  office: "Office",
  retail: "Retail",
  warehouse: "Warehouse",
  land: "Land",
  project_unit: "Project unit",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  verified: "Verified",
  premium: "Premium verified",
};

export const furnishingLabels: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  semi: "Semi-furnished",
  furnished: "Furnished",
};

export const amenityLabels: Record<AmenityKey, string> = {
  parking: "Parking",
  pool: "Pool",
  elevator: "Elevator",
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  gym: "Gym",
  security: "Security",
  air_conditioning: "Air conditioning",
  sea_view: "Sea view",
  pet_friendly: "Pet friendly",
  workspace: "Workspace",
};

export const amenityOptions = Object.entries(amenityLabels).map(([value, label]) => ({
  value: value as AmenityKey,
  label,
}));

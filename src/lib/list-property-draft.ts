import type { DealSelection } from "@/components/dashboard/list-property-deal-step";
import { DEFAULT_COUNTRY_CODE, isWorldCountryCode } from "@/data/countries";
import type { PropertyType, TransactionType } from "@/lib/types";

export const LIST_PROPERTY_DRAFT_KEY = "seaps-list-property-draft";
const DRAFT_VERSION = 1;

export type ListPropertyDraftForm = {
  transactionType: TransactionType;
  propertyType: PropertyType;
  countryCode: string;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  commune: string;
  communeSlug: string;
  address: string;
  price: string;
  currency: string;
  pricePeriod: "" | "month" | "night" | "year";
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  title: string;
  summary: string;
  description: string;
  imageUrl: string;
  contactName: string;
  contactEmail: string;
};

export type ListPropertyDraft = {
  version: number;
  updatedAt: string;
  form: ListPropertyDraftForm;
  dealSelection: DealSelection | null;
};

export const listPropertyDefaultForm: ListPropertyDraftForm = {
  transactionType: "sale",
  propertyType: "apartment",
  countryCode: DEFAULT_COUNTRY_CODE,
  city: "Phnom Penh",
  citySlug: "phnom-penh",
  district: "BKK 1",
  districtSlug: "bkk-1",
  commune: "",
  communeSlug: "",
  address: "",
  price: "",
  currency: "USD",
  pricePeriod: "",
  bedrooms: "2",
  bathrooms: "1",
  areaSqm: "80",
  title: "",
  summary: "",
  description: "",
  imageUrl: "/media/photos/photo-1502672260266-1c1ef2d93688.jpg",
  contactName: "",
  contactEmail: "",
};

const PROPERTY_TYPES = new Set<PropertyType>([
  "apartment",
  "condo",
  "house",
  "villa",
  "townhouse",
  "commercial",
  "office",
  "retail",
  "warehouse",
  "land",
  "project_unit",
]);

const TRANSACTION_TYPES = new Set<TransactionType>(["sale", "rent", "short_stay"]);
const PRICE_PERIODS = new Set<ListPropertyDraftForm["pricePeriod"]>(["", "month", "night", "year"]);
const LISTING_CATEGORIES = new Set<DealSelection["category"]>([
  "land",
  "residential",
  "commercial",
  "development",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(obj: Record<string, unknown>, key: string, fallback: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : fallback;
}

function parseDealSelection(value: unknown): DealSelection | null {
  if (!isRecord(value)) return null;
  const transactionType = value.transactionType;
  const category = value.category;
  if (
    (transactionType !== "sale" && transactionType !== "rent") ||
    typeof category !== "string" ||
    !LISTING_CATEGORIES.has(category as DealSelection["category"])
  ) {
    return null;
  }
  return { transactionType, category: category as DealSelection["category"] };
}

function parseForm(value: unknown): ListPropertyDraftForm {
  if (!isRecord(value)) return { ...listPropertyDefaultForm };

  const base = { ...listPropertyDefaultForm };
  const transactionType = pickString(value, "transactionType", base.transactionType);
  const propertyType = pickString(value, "propertyType", base.propertyType);
  const countryCode = pickString(value, "countryCode", base.countryCode).toUpperCase();
  const pricePeriod = pickString(value, "pricePeriod", base.pricePeriod);

  return {
    ...base,
    transactionType: TRANSACTION_TYPES.has(transactionType as TransactionType)
      ? (transactionType as TransactionType)
      : base.transactionType,
    propertyType: PROPERTY_TYPES.has(propertyType as PropertyType)
      ? (propertyType as PropertyType)
      : base.propertyType,
    countryCode: isWorldCountryCode(countryCode) ? countryCode : base.countryCode,
    city: pickString(value, "city", base.city),
    citySlug: pickString(value, "citySlug", base.citySlug),
    district: pickString(value, "district", base.district),
    districtSlug: pickString(value, "districtSlug", base.districtSlug),
    commune: pickString(value, "commune", base.commune),
    communeSlug: pickString(value, "communeSlug", base.communeSlug),
    address: pickString(value, "address", base.address),
    price: pickString(value, "price", base.price),
    currency: pickString(value, "currency", base.currency),
    pricePeriod: PRICE_PERIODS.has(pricePeriod as ListPropertyDraftForm["pricePeriod"])
      ? (pricePeriod as ListPropertyDraftForm["pricePeriod"])
      : base.pricePeriod,
    bedrooms: pickString(value, "bedrooms", base.bedrooms),
    bathrooms: pickString(value, "bathrooms", base.bathrooms),
    areaSqm: pickString(value, "areaSqm", base.areaSqm),
    title: pickString(value, "title", base.title),
    summary: pickString(value, "summary", base.summary),
    description: pickString(value, "description", base.description),
    imageUrl: pickString(value, "imageUrl", base.imageUrl),
    contactName: pickString(value, "contactName", base.contactName),
    contactEmail: pickString(value, "contactEmail", base.contactEmail),
  };
}

export function loadListPropertyDraft(): ListPropertyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LIST_PROPERTY_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== DRAFT_VERSION) return null;
    return {
      version: DRAFT_VERSION,
      updatedAt: pickString(parsed, "updatedAt", new Date().toISOString()),
      form: parseForm(parsed.form),
      dealSelection: parseDealSelection(parsed.dealSelection),
    };
  } catch {
    return null;
  }
}

export function saveListPropertyDraft(payload: {
  form: ListPropertyDraftForm;
  dealSelection: DealSelection | null;
}): void {
  if (typeof window === "undefined") return;
  const draft: ListPropertyDraft = {
    version: DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    form: payload.form,
    dealSelection: payload.dealSelection,
  };
  try {
    window.localStorage.setItem(LIST_PROPERTY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearListPropertyDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LIST_PROPERTY_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

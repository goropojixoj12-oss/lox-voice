import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { readActingAgentUserIdFromRequest } from "@/lib/agent-desk-acting-user";
import { getPlatformUserById } from "@/lib/admin-platform-users";
import { getSession, requireRole } from "@/lib/auth";
import { getAllProperties } from "@/lib/catalog";
import { isPublicListing } from "@/lib/listing-access";
import { saveRuntimeListing } from "@/lib/store";
import { countrySlugFromName, getCountryByCode, isWorldCountryCode } from "@/data/countries";
import { slugify } from "@/lib/utils";
import type { Property } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const all = await getAllProperties();
  const published = all.filter((p) => isPublicListing(p));
  const items = city ? published.filter((p) => p.location.citySlug === city) : published;
  return NextResponse.json({ items, total: items.length });
}

const createSchema = z.object({
  title: z.string().min(8),
  summary: z.string().min(12),
  description: z.string().min(40),
  transactionType: z.enum(["sale", "rent", "short_stay"]),
  propertyType: z.enum([
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
  ]),
  price: z.number().positive(),
  currency: z.string().min(3),
  pricePeriod: z.enum(["month", "night", "year"]).nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  areaSqm: z.number().nullable(),
  countryCode: z
    .string()
    .length(2)
    .refine((code) => isWorldCountryCode(code.toUpperCase()), { message: "Invalid country" }),
  city: z.string().min(2),
  citySlug: z.string().min(2),
  district: z.string().min(2),
  districtSlug: z.string().min(2),
  commune: z.string().min(2),
  communeSlug: z.string().min(2),
  address: z.string().min(3),
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        url: z.string().min(1),
        alt: z.string().min(1),
        isCover: z.boolean().optional(),
      }),
    )
    .default([]),
  videos: z
    .array(
      z.object({
        id: z.string().min(1),
        url: z.string().min(1),
        label: z.string().optional(),
        role: z.enum(["tour", "card_preview"]).optional(),
      }),
    )
    .optional(),
  cardPreviewVideoUrl: z.string().nullable().optional(),
  createdByUserId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["owner", "agent", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  let listingOwnerId = session.id;
  let listingSellerType: Property["sellerType"] =
    session.role === "agent" ? "agent" : "owner";

  if (session.role === "admin") {
    const targetId =
      data.createdByUserId?.trim() || readActingAgentUserIdFromRequest(request)?.trim() || null;
    if (targetId) {
      const agentUser = await getPlatformUserById(targetId);
      if (!agentUser || agentUser.role !== "agent") {
        return NextResponse.json({ error: "Agent account not found" }, { status: 404 });
      }
      listingOwnerId = agentUser.id;
      listingSellerType = "agent";
    }
  } else if (session.role === "agent") {
    listingOwnerId = session.id;
    listingSellerType = "agent";
  }

  const countryRow = getCountryByCode(data.countryCode);
  if (!countryRow) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const listing: Property = {
    id: `runtime-${nanoid(8)}`,
    slug: `${slugify(data.title)}-${nanoid(5)}`,
    title: data.title,
    summary: data.summary,
    description: data.description,
    transactionType: data.transactionType,
    propertyType: data.propertyType,
    status: "pending",
    verification: "unverified",
    sellerType: listingSellerType,
    price: data.price,
    currency: data.currency,
    pricePeriod: data.pricePeriod,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    areaSqm: data.areaSqm,
    landSqm: null,
    furnishing: null,
    amenities: [],
    images: data.images,
    videos: data.videos,
    cardPreviewVideoUrl: data.cardPreviewVideoUrl ?? null,
    hasVideoTour: Boolean(data.videos?.length),
    location: {
      country: countryRow.name,
      countrySlug: countrySlugFromName(countryRow.name),
      city: data.city,
      citySlug: data.citySlug,
      district: data.district,
      districtSlug: data.districtSlug,
      commune: data.commune,
      communeSlug: data.communeSlug,
      address: data.address,
      lat: 0,
      lng: 0,
    },
    createdByUserId: listingOwnerId,
    ownerId: session.role === "owner" && listingOwnerId === session.id ? session.id : undefined,
    agentId: undefined,
    agencyId: session.agencyId,
    publishedAt: now,
    updatedAt: now,
    views: 0,
    inquiries: 0,
  };

  await saveRuntimeListing(listing);
  const me = await getSession();
  return NextResponse.json({ listing, submittedBy: me?.id }, { status: 201 });
}

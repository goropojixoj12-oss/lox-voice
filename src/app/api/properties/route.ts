import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getSession, requireRole } from "@/lib/auth";
import { getAllProperties } from "@/lib/catalog";
import { saveRuntimeListing } from "@/lib/store";
import { slugify } from "@/lib/utils";
import type { Property } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const all = await getAllProperties();
  const items = city ? all.filter((p) => p.location.citySlug === city) : all;
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
  city: z.string().min(2),
  citySlug: z.string().min(2),
  district: z.string().min(2),
  districtSlug: z.string().min(2),
  address: z.string().min(3),
  imageUrl: z.string().url(),
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
    sellerType: session.role === "agent" ? "agent" : "owner",
    price: data.price,
    currency: data.currency,
    pricePeriod: data.pricePeriod,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    areaSqm: data.areaSqm,
    landSqm: null,
    furnishing: null,
    amenities: [],
    images: [
      {
        id: "cover",
        url: data.imageUrl,
        alt: data.title,
        isCover: true,
      },
    ],
    location: {
      country: "Demo",
      countrySlug: "demo",
      city: data.city,
      citySlug: data.citySlug,
      district: data.district,
      districtSlug: data.districtSlug,
      address: data.address,
      lat: 0,
      lng: 0,
    },
    ownerId: session.role === "owner" ? session.id : undefined,
    agentId: session.role === "agent" ? "agent-maya" : undefined,
    agencyId: session.agencyId,
    publishedAt: now,
    updatedAt: now,
    demo: true,
    views: 0,
    inquiries: 0,
  };

  await saveRuntimeListing(listing);
  const me = await getSession();
  return NextResponse.json({ listing, submittedBy: me?.id }, { status: 201 });
}

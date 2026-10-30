import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import {
  deleteRuntimeListing,
  getRuntimeListingById,
  saveRuntimeListing,
} from "@/lib/store";
import { resetListingViewTracking } from "@/lib/listing-view-store";
import { countrySlugFromName, getCountryByCode, isWorldCountryCode } from "@/data/countries";
import type {
  DocAccessLevel,
  ListingDocument,
  ListingNote,
  ListingStatus,
  NoteVisibility,
  Property,
} from "@/lib/types";

const imageSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1),
  isCover: z.boolean().optional(),
});

const videoSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  label: z.string().optional(),
  role: z.enum(["tour", "card_preview"]).optional(),
});

const patchSchema = z.object({
  action: z.enum(["save", "publish", "reject"]).optional(),
  title: z.string().min(8).optional(),
  summary: z.string().min(12).optional(),
  description: z.string().min(40).optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(3).optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
  transactionType: z.enum(["sale", "rent", "short_stay"]).optional(),
  propertyType: z.enum([
    "apartment", "condo", "house", "villa", "townhouse",
    "commercial", "office", "retail", "warehouse", "land", "project_unit",
  ]).optional(),
  pricePeriod: z.enum(["month", "night", "year"]).nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  areaSqm: z.number().nullable().optional(),
  countryCode: z.string().length(2).optional(),
  city: z.string().min(2).optional(),
  citySlug: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  districtSlug: z.string().min(2).optional(),
  commune: z.string().min(2).optional(),
  communeSlug: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  images: z.array(imageSchema).optional(),
  videos: z.array(videoSchema).optional(),
  cardPreviewVideoUrl: z.string().nullable().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  assignedAgentId: z.string().optional(),
  commissionAgent: z.number().nonnegative().optional(),
  commissionCompany: z.number().nonnegative().optional(),
  notes: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    authorId: z.string().min(1),
    authorName: z.string().min(1),
    visibility: z.enum(["admin_only", "staff", "public"]),
    createdAt: z.string().min(1),
  })).optional(),
  documents: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().min(1),
    storageKey: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().nonnegative(),
    access: z.enum(["admin_only", "staff", "public"]),
    uploadedById: z.string().min(1),
    uploadedByName: z.string().min(1),
    createdAt: z.string().min(1),
  })).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const listing = await getRuntimeListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRuntimeListingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date().toISOString();
  let status: ListingStatus = existing.status;

  if (data.action === "publish") status = "published";
  else if (data.action === "reject") status = "rejected";
  else if (data.action === "save") status = existing.status === "published" ? "published" : "pending";
  else if (data.status) status = data.status;

  const location = { ...existing.location };
  if (data.countryCode) {
    const countryRow = getCountryByCode(data.countryCode.toUpperCase());
    if (countryRow) {
      location.country = countryRow.name;
      location.countrySlug = countrySlugFromName(countryRow.name);
    }
  }
  if (data.city !== undefined) location.city = data.city;
  if (data.citySlug !== undefined) location.citySlug = data.citySlug;
  if (data.district !== undefined) location.district = data.district;
  if (data.districtSlug !== undefined) location.districtSlug = data.districtSlug;
  if (data.commune !== undefined) location.commune = data.commune;
  if (data.communeSlug !== undefined) location.communeSlug = data.communeSlug;
  if (data.address !== undefined) location.address = data.address;

  const updated: Property = {
    ...existing,
    title: data.title ?? existing.title,
    summary: data.summary ?? existing.summary,
    description: data.description ?? existing.description,
    price: data.price ?? existing.price,
    currency: data.currency ?? existing.currency,
    transactionType: data.transactionType ?? existing.transactionType,
    propertyType: data.propertyType ?? existing.propertyType,
    pricePeriod: data.pricePeriod !== undefined ? data.pricePeriod : existing.pricePeriod,
    bedrooms: data.bedrooms !== undefined ? data.bedrooms : existing.bedrooms,
    bathrooms: data.bathrooms !== undefined ? data.bathrooms : existing.bathrooms,
    areaSqm: data.areaSqm !== undefined ? data.areaSqm : existing.areaSqm,
    images: data.images ?? existing.images,
    videos: data.videos !== undefined ? data.videos : existing.videos,
    cardPreviewVideoUrl: data.cardPreviewVideoUrl !== undefined
      ? data.cardPreviewVideoUrl
      : existing.cardPreviewVideoUrl,
    hasVideoTour: data.videos !== undefined
      ? data.videos.some((v) => v.role === "tour")
      : existing.hasVideoTour,
    assignedAgentId: data.assignedAgentId !== undefined ? data.assignedAgentId : existing.assignedAgentId,
    commissionAgent: data.commissionAgent !== undefined ? data.commissionAgent : existing.commissionAgent,
    commissionCompany: data.commissionCompany !== undefined ? data.commissionCompany : existing.commissionCompany,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    documents: data.documents !== undefined ? data.documents : existing.documents,
    location,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? now : existing.publishedAt,
  };

  await saveRuntimeListing(updated);
  return NextResponse.json({ listing: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRuntimeListingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "rejected") {
    return NextResponse.json(
      { error: "Only rejected listings can be deleted from this action" },
      { status: 400 },
    );
  }

  const removed = await deleteRuntimeListing(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await resetListingViewTracking(id).catch(() => undefined);
  return NextResponse.json({ ok: true });
}

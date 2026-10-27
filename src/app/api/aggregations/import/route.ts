import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { importAggregatedDraft } from "@/lib/aggregations/sync";
import { resolveExternalId } from "@/lib/aggregations/dedupe";
import { sanitizeDescription } from "@/lib/aggregations/sanitize";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Manual paste / future webhook intake for FB/Telegram connectors.
 * Admin session OR Bearer AGGREGATION_SYNC_SECRET.
 */
const importSchema = z.object({
  title: z.string().min(4).max(200),
  description: z.string().min(8).max(8000),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).optional(),
  location: z.string().max(200).nullable().optional(),
  propertyType: z
    .enum([
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
    ])
    .nullable()
    .optional(),
  photos: z.array(z.string().min(1)).max(12).optional(),
  publishedAt: z.string().min(4).max(40).nullable().optional(),
  sourceName: z.string().min(2).max(120),
  sourceUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  contacts: z
    .object({
      phone: z.string().max(40).optional(),
      email: z.string().email().optional(),
      messenger: z.string().max(120).optional(),
    })
    .optional(),
  externalId: z.string().min(2).max(160).optional(),
});

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.AGGREGATION_SYNC_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  const session = await requireRole(["admin"]);
  return Boolean(session);
}

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "agg-import"), {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: limited.retryAfterSec },
      { status: 429 },
    );
  }

  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const price = data.price ?? null;
  const location = data.location ?? null;
  const externalId = resolveExternalId({
    externalId: data.externalId,
    title: data.title,
    price,
    location,
  });

  const importResult = await importAggregatedDraft({
    title: data.title,
    description: sanitizeDescription(data.description),
    price,
    currency: data.currency ?? "USD",
    location,
    propertyType: data.propertyType ?? null,
    photos: data.photos ?? [],
    publishedAt: data.publishedAt ?? new Date().toISOString(),
    sourceName: data.sourceName,
    sourceUrl: data.sourceUrl ?? null,
    contacts: data.contacts ?? {},
    externalId,
  });

  if ("rejected" in importResult) {
    return NextResponse.json(
      {
        error: "Listing rejected by ingest filter (not real estate)",
        reason: importResult.reason,
        hint: "Set propertyType to a RE type or include clear property keywords in title/description.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      created: importResult.created,
      listing: importResult.listing,
    },
    { status: importResult.created ? 201 : 200 },
  );
}

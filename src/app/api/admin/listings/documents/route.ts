import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { writeListingMediaFile } from "@/lib/listing-media-files";
import type { DocAccessLevel, ListingDocument } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const VALID_ACCESS: DocAccessLevel[] = ["admin_only", "staff", "public"];

export async function POST(request: Request) {
  const session = await requireRole(["admin", "agent"]);
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const listingId = (form.get("listingId") as string)?.trim();
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const customName = (form.get("customName") as string)?.trim() || file.name;
    const accessRaw = (form.get("access") as string)?.trim() || "staff";
    const access: DocAccessLevel = VALID_ACCESS.includes(accessRaw as DocAccessLevel)
      ? (accessRaw as DocAccessLevel)
      : "staff";

    if (session.role !== "admin" && access === "admin_only") {
      return NextResponse.json({ error: "Only admin can set admin-only access." }, { status: 403 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "bin";
    const storageKey = `docs/${listingId}/${nanoid(10)}.${ext}`;
    const saved = await writeListingMediaFile(storageKey, bytes, file.type || "application/octet-stream");

    const doc: ListingDocument = {
      id: nanoid(8),
      name: customName,
      url: saved.url,
      storageKey: saved.storageKey,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      access,
      uploadedById: session.id,
      uploadedByName: session.name,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("document upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}

import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  LISTING_MEDIA_MAX_IMAGE_BYTES,
  LISTING_MEDIA_MAX_VIDEO_BYTES,
} from "@/lib/listing-media-constants";
import { inferMimeType, mediaKindFromMime } from "@/lib/listing-media-mime";
import { sanitizeListingFileName } from "@/lib/listing-media-constants";
import { writeListingMediaFile } from "@/lib/listing-media-files";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!["owner", "agent", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const mime = inferMimeType(file);
    const kind = mediaKindFromMime(mime);
    if (!kind) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WebP, GIF, MP4, MOV, or WebM files." },
        { status: 400 },
      );
    }

    const maxBytes =
      kind === "video" ? LISTING_MEDIA_MAX_VIDEO_BYTES : LISTING_MEDIA_MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            kind === "video"
              ? "Video must be 80MB or smaller. Use client upload for large files."
              : "Each photo must be 12MB or smaller.",
        },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeListingFileName(file.name || "upload");
    const storageKey = `${session.id}/${nanoid(10)}-${safeName}`;
    const saved = await writeListingMediaFile(storageKey, bytes, mime);

    return NextResponse.json({
      item: {
        id: nanoid(8),
        kind,
        url: saved.url,
        storageKey: saved.storageKey,
        name: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("listing media upload failed", error);
    const message =
      error instanceof Error ? error.message : "Upload failed. Try again or use a smaller file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

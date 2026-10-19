import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  sanitizeListingFileName,
  writeListingMediaFile,
} from "@/lib/listing-media-files";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function mediaKind(mime: string): "image" | "video" | null {
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime) || mime.startsWith("video/")) return "video";
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!["owner", "agent", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const kind = mediaKind(mime);
  if (!kind) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WebP, GIF, MP4, or WebM files." },
      { status: 400 },
    );
  }

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error:
          kind === "video"
            ? "Video must be 80MB or smaller."
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
}

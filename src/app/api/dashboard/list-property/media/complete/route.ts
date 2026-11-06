import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import {
  LISTING_MEDIA_MAX_IMAGE_BYTES,
  LISTING_MEDIA_MAX_VIDEO_BYTES,
} from "@/lib/listing-media-constants";
import { mediaKindFromMime } from "@/lib/listing-media-mime";
import { saveListingUpload } from "@/lib/listing-upload-git";
import {
  assembleUpload,
  discardUploadSession,
  readUploadSession,
} from "@/lib/listing-upload-chunks";
import { resolveUploadTarget } from "@/lib/listing-upload-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Joins the staged slices and commits the finished file to the repository. */
export async function POST(request: Request) {
  const target = await resolveUploadTarget(request);
  if (!target.ok) return target.response;

  let uploadId = "";
  try {
    const body = (await request.json()) as { uploadId?: string };
    uploadId = body.uploadId ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = await readUploadSession(uploadId);
  if (!session) {
    return NextResponse.json({ error: "Upload session expired, try again" }, { status: 410 });
  }
  if (session.userId !== target.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kind = mediaKindFromMime(session.contentType);
  if (!kind) {
    await discardUploadSession(session.uploadId, session.totalChunks);
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  try {
    const bytes = await assembleUpload(session);
    if (bytes.byteLength !== session.size) {
      await discardUploadSession(session.uploadId, session.totalChunks);
      return NextResponse.json(
        { error: "Upload is incomplete, try again" },
        { status: 409 },
      );
    }
    const maxBytes =
      kind === "video" ? LISTING_MEDIA_MAX_VIDEO_BYTES : LISTING_MEDIA_MAX_IMAGE_BYTES;
    if (bytes.byteLength > maxBytes) {
      await discardUploadSession(session.uploadId, session.totalChunks);
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

    const saved = await saveListingUpload({
      userId: target.userId,
      fileName: session.fileName,
      bytes,
      contentType: session.contentType,
    });
    await discardUploadSession(session.uploadId, session.totalChunks);

    return NextResponse.json({
      item: {
        id: nanoid(8),
        kind,
        url: saved.url,
        storageKey: saved.path,
        name: session.fileName,
        size: bytes.byteLength,
      },
    });
  } catch (error) {
    console.error("chunked listing upload failed", error);
    await discardUploadSession(session.uploadId, session.totalChunks);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
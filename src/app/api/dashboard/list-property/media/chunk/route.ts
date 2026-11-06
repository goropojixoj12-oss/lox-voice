import { NextResponse } from "next/server";
import { CHUNK_SIZE, readUploadSession, writeUploadChunk } from "@/lib/listing-upload-chunks";
import { resolveUploadTarget } from "@/lib/listing-upload-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Stores one slice of a chunked upload. Retries are safe: same index overwrites. */
export async function PUT(request: Request) {
  const target = await resolveUploadTarget(request);
  if (!target.ok) return target.response;

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const index = Number(url.searchParams.get("index"));

  const session = await readUploadSession(uploadId);
  if (!session) {
    return NextResponse.json({ error: "Upload session expired, try again" }, { status: 410 });
  }
  if (session.userId !== target.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!Number.isInteger(index) || index < 0 || index >= session.totalChunks) {
    return NextResponse.json({ error: "Slice index out of range" }, { status: 400 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "Empty slice" }, { status: 400 });
  }
  if (bytes.byteLength > CHUNK_SIZE + 1024) {
    return NextResponse.json({ error: "Slice too large" }, { status: 413 });
  }

  await writeUploadChunk(uploadId, index, bytes);
  return NextResponse.json({ ok: true, index, bytes: bytes.byteLength });
}
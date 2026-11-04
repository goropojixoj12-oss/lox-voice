import { NextResponse } from "next/server";
import { readListingMediaFile } from "@/lib/listing-media-files";

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const storageKey = segments.map((s) => decodeURIComponent(s)).join("/");
  if (storageKey.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const file = await readListingMediaFile(storageKey);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      // photos are deletable, so only the edge may hold them, and only briefly
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

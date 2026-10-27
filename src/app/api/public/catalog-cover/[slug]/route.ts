import { NextResponse } from "next/server";
import { catalogCoverBySlug } from "@/lib/catalog-page-covers";
import { readSiteRequestAttachment } from "@/lib/site-agent-attachments";
import { promises as fs } from "fs";
import path from "path";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const entry = catalogCoverBySlug[slug];
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (entry.publicAssetPath) {
    const filePath = path.join(process.cwd(), "public", entry.publicAssetPath.replace(/^\//, ""));
    try {
      const bytes = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "application/octet-stream";
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch {
      /* fall through to blob attachment */
    }
  }

  const file = await readSiteRequestAttachment(entry.storageKey);
  if (!file) return NextResponse.json({ error: "Cover not available" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

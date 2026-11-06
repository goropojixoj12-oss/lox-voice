import type { Property } from "@/lib/types";

export const LISTINGS_BEGIN = "// <listings:begin> (generated from content/listings - do not edit by hand)";
export const LISTINGS_END = "// <listings:end>";

/** Orders cards the same way the CLI generator does: featured first, then newest. */
function sortListings(items: Property[]): Property[] {
  return [...items].sort((a, b) => {
    const feat = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    if (feat !== 0) return feat;
    return Date.parse(b.publishedAt ?? "0") - Date.parse(a.publishedAt ?? "0");
  });
}

export function renderListingsBlock(items: Property[]): string {
  const body = sortListings(items)
    .map((listing) =>
      JSON.stringify(listing, null, 2)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n"),
    )
    .join(",\n");

  return `${LISTINGS_BEGIN}
export const properties: Property[] = [
${body},
];
${LISTINGS_END}`;
}

/** Swaps the generated array inside the existing properties.ts source. */
export function applyListingsBlock(source: string, items: Property[]): string {
  const start = source.indexOf(LISTINGS_BEGIN);
  const stop = source.indexOf(LISTINGS_END);
  if (start < 0 || stop < 0) {
    throw new Error("properties.ts markers not found");
  }
  return source.slice(0, start) + renderListingsBlock(items) + source.slice(stop + LISTINGS_END.length);
}
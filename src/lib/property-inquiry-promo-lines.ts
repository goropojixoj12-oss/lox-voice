import type { Property } from "@/lib/types";

/** Short, evenly spaced lines under the listing cover in the property inquiry panel. */
export function propertyInquiryPromoLines(property: Property): string[] {
  const bedroomLabel =
    property.bedrooms === 0 ? "Studio" : `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`;
  const lines: string[] = [
    `${bedroomLabel} · ${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}`,
  ];
  if (property.areaSqm) {
    lines.push(`${property.areaSqm} m² · Fully furnished`);
  } else {
    lines.push("Fully furnished · Available immediately");
  }
  lines.push("Foreign ownership approved (Hard Title)");
  lines.push("Priced significantly under cost value");
  return lines;
}

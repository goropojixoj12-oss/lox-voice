import type { Metadata } from "next";

/** Catalog listing metadata: self-canonical on clean path; noindex when filters/pagination present. */
export function catalogRouteMetadata({
  path,
  title,
  description,
  searchParams,
}: {
  path: string;
  title: string;
  description: string;
  searchParams?: Record<string, string | string[] | undefined>;
}): Metadata {
  const keys = Object.keys(searchParams ?? {}).filter((key) => {
    const value = searchParams?.[key];
    if (value == null || value === "") return false;
    if (key === "page" && String(Array.isArray(value) ? value[0] : value) === "1") {
      return false;
    }
    return true;
  });
  const filtered = keys.length > 0;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    robots: filtered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

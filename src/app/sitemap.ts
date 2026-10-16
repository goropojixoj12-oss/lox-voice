import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { agents } from "@/data/agencies";
import { articles } from "@/data/articles";
import { cities } from "@/data/locations";
import { projects } from "@/data/projects";
import { properties } from "@/data/properties";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/search",
    "/buy/residential",
    "/buy/land",
    "/rent/residential",
    "/rent/land",
    "/short-stay",
    "/projects",
    "/commercial",
    "/land",
    "/usefullinks",
    "/insights",
    "/guides",
    "/map",
    "/about",
    "/contact",
    "/sale",
    "/inquires",
    "/privacy",
    "/terms",
    "/property-guide",
    "/careers",
  ].map((path) => ({
    url: `${brand.url}${path}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...properties.map((p) => ({ url: `${brand.url}/property/${p.slug}`, lastModified: new Date(p.updatedAt) })),
    ...projects.map((p) => ({ url: `${brand.url}/projects/${p.slug}`, lastModified: new Date() })),
    ...agents.map((a) => ({ url: `${brand.url}/agents/${a.slug}`, lastModified: new Date() })),
    ...articles.map((a) => ({
      url: `${brand.url}/${a.category === "guides" || a.category === "investor" ? "guides" : "insights"}/${a.slug}`,
      lastModified: new Date(a.publishedAt),
    })),
    ...cities.flatMap((city) => [
      { url: `${brand.url}/locations/${city.slug}`, lastModified: new Date() },
      ...city.districts.map((d) => ({
        url: `${brand.url}/locations/${city.slug}/${d.slug}`,
        lastModified: new Date(),
      })),
    ]),
  ];
}

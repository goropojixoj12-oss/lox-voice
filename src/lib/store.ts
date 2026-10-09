import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Inquiry, Property, SavedSearch } from "@/lib/types";

const dataDir = path.join(process.cwd(), ".data");

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  const full = path.join(dataDir, file);
  try {
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDir();
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2), "utf8");
}

export async function getRuntimeListings() {
  return readJson<Property[]>("listings.json", []);
}

export async function saveRuntimeListing(listing: Property) {
  const listings = await getRuntimeListings();
  const idx = listings.findIndex((l) => l.id === listing.id);
  if (idx >= 0) listings[idx] = listing;
  else listings.unshift(listing);
  await writeJson("listings.json", listings);
  return listing;
}

export async function getInquiries() {
  return readJson<Inquiry[]>("inquiries.json", []);
}

export async function createInquiry(input: Omit<Inquiry, "id" | "createdAt" | "status">) {
  const inquiries = await getInquiries();
  const inquiry: Inquiry = {
    ...input,
    id: nanoid(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  inquiries.unshift(inquiry);
  await writeJson("inquiries.json", inquiries);
  return inquiry;
}

export async function getSavedSearches(userId: string) {
  const all = await readJson<Record<string, SavedSearch[]>>("saved-searches.json", {});
  return all[userId] ?? [];
}

export async function saveSearch(userId: string, name: string, params: Record<string, string>) {
  const all = await readJson<Record<string, SavedSearch[]>>("saved-searches.json", {});
  const entry: SavedSearch = {
    id: nanoid(),
    name,
    params,
    createdAt: new Date().toISOString(),
  };
  all[userId] = [entry, ...(all[userId] ?? [])];
  await writeJson("saved-searches.json", all);
  return entry;
}

export async function getFavorites(userId: string) {
  const all = await readJson<Record<string, string[]>>("favorites.json", {});
  return all[userId] ?? [];
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const all = await readJson<Record<string, string[]>>("favorites.json", {});
  const current = new Set(all[userId] ?? []);
  if (current.has(propertyId)) current.delete(propertyId);
  else current.add(propertyId);
  all[userId] = [...current];
  await writeJson("favorites.json", all);
  return all[userId];
}

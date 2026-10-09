import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amount: number,
  currency = "USD",
  options?: { compact?: boolean; period?: "month" | "night" | "year" | null },
) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: options?.compact && amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1000 ? 0 : 0,
  });
  const base = formatter.format(amount);
  if (!options?.period) return base;
  const labels = { month: "/mo", night: "/night", year: "/yr" } as const;
  return `${base}${labels[options.period]}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function daysAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

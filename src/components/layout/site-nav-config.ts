import type { NavEntry } from "@/components/layout/nav-menu-dropdown";

/** Primary site navigation — shared by header and footer. */
export const primaryNav: NavEntry[] = [
  { type: "link", href: "/about", label: "About Us" },
  { type: "link", href: "/projects", label: "Projects/Developments" },
  { type: "link", href: "/usefullinks", label: "Useful Links" },
  { type: "link", href: "/insights", label: "Market Insights" },
  { type: "link", href: "/property-guide", label: "Property Guide" },
  { type: "link", href: "/careers", label: "Careers" },
];

/** @deprecated Listings catalog removed from site navigation. */
export const dealSubmenu = (_prefix: "buy" | "rent") => [] as const;

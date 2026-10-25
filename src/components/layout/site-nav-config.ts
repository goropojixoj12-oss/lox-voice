import type { NavEntry } from "@/components/layout/nav-menu-dropdown";

export const dealSubmenu = (prefix: "buy" | "rent") =>
  [
    { href: `/${prefix}/land`, label: "Land" },
    { href: `/${prefix}/residential`, label: "Residential" },
    { href: "/commercial", label: "Commercial" },
  ] as const;

/** Primary site navigation — shared by header and footer. */
export const primaryNav: NavEntry[] = [
  { type: "link", href: "/about", label: "About Us" },
  {
    type: "dropdown",
    label: "Buy",
    href: "/buy/residential",
    items: [...dealSubmenu("buy")],
  },
  {
    type: "dropdown",
    label: "Rent",
    href: "/rent/residential",
    items: [...dealSubmenu("rent")],
  },
  { type: "link", href: "/projects", label: "Projects/Developments" },
  { type: "link", href: "/usefullinks", label: "Useful Links" },
  { type: "link", href: "/insights", label: "Market Insights" },
  { type: "link", href: "/property-guide", label: "Property Guide" },
  { type: "link", href: "/careers", label: "Careers" },
];

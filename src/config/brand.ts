export const brand = {
  name: "SEAPS",
  fullName: "South East Asia Property Services",
  tagline: "South East Asia Property Services",
  description:
    "SEAPS — South East Asia Property Services — is a modern marketplace for buying, renting, and investing in residential and commercial real estate across the region and beyond.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43123",
  locale: "en",
  supportEmail: "hello@seaps.demo",
  demoMode: true,
  social: {
    linkedin: "#",
    x: "#",
    instagram: "#",
  },
  logo: {
    text: "SEAPS",
    subtitle: "South East Asia Property Services",
    mark: "SE",
  },
  theme: {
    primary: "#0B1C33",
    primarySoft: "#143252",
    background: "#07111F",
    surface: "#0F2138",
    accent: "#D4AF37",
    accentSoft: "#F0D78C",
    secondary: "#162B45",
    sand: "#2A3F5C",
    mist: "#1A3050",
    text: "#E8EEF7",
    muted: "#9AADC2",
    border: "#2A4060",
    success: "#3D8B6E",
    warning: "#D4AF37",
    danger: "#C45C5C",
  },
  mapProvider: (process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "none") as
    | "mapbox"
    | "google"
    | "none",
} as const;

export type BrandConfig = typeof brand;

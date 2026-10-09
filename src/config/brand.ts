export const brand = {
  name: "EstateNova",
  tagline: "International property, curated with clarity",
  description:
    "EstateNova is a modern marketplace for buying, renting, and investing in residential and commercial real estate across global cities.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43123",
  locale: "en",
  supportEmail: "hello@estatenova.demo",
  demoMode: true,
  social: {
    linkedin: "#",
    x: "#",
    instagram: "#",
  },
  logo: {
    text: "EstateNova",
    mark: "EN",
  },
  theme: {
    primary: "#0F2E24",
    primarySoft: "#1A4638",
    background: "#F6F3EE",
    surface: "#FFFcf8",
    accent: "#C45C3E",
    accentSoft: "#E8A090",
    secondary: "#E7DFD3",
    sand: "#D9CFC0",
    mist: "#EEF1EE",
    text: "#1C1F1E",
    muted: "#5E6763",
    border: "#D8D2C8",
    success: "#2F6B4F",
    warning: "#B7791F",
    danger: "#A33B2B",
  },
  mapProvider: (process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "none") as
    | "mapbox"
    | "google"
    | "none",
} as const;

export type BrandConfig = typeof brand;

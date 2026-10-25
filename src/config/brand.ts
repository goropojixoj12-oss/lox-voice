export const brand = {
  name: "SEAPS",
  fullName: "South East Asia Property Services Co. Ltd",
  tagline: "Trusted property services across Cambodia since 2013",
  description:
    "SEAPS — South East Asia Property Services — helps buyers, renters, and investors find residential and commercial property across Cambodia, with local expertise since 2013.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_ENV === "production"
      ? "https://www.vps1.store"
      : "http://127.0.0.1:43123"),
  locale: "en",
  supportEmail: "info@seaps.asia",
  foundedYear: 2013,
  country: "Cambodia",
  social: {
    telegram: "#",
    facebook: "#",
    whatsapp: "#",
    tiktok: "#",
    linkedin: "#",
    reddit: "#",
    wechat: "#",
    instagram: "#",
  },
  logo: {
    text: "SEAPS",
    subtitle: "South East Asia Property Services Co. Ltd",
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
  officeAddress: {
    line1: "Unit 3/4, Cambodiana Hotel",
    line2: "#313 Preah Sisowath Quay,",
    cityLine: "Phnom Penh, 12206",
    country: "Cambodia",
  },
  /** Google Maps place search (open in new tab). */
  googleMapsPlaceUrl:
    "https://www.google.com/maps/search/?api=1&query=Unit+3%2F4%2C+Cambodiana+Hotel%2C+%23313+Preah+Sisowath+Quay%2C+Phnom+Penh%2C+12206%2C+Cambodia",
  /** Google Maps embed iframe src (Share → Embed a map). Override with NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL. */
  googleMapsEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL?.trim() ||
    "https://maps.google.com/maps?q=Unit+3%2F4%2C+Cambodiana+Hotel%2C+%23313+Preah+Sisowath+Quay%2C+Phnom+Penh%2C+12206%2C+Cambodia&hl=en&z=16&output=embed",
} as const;

export type BrandConfig = typeof brand;

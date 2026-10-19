import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { PageViewBeacon } from "@/components/analytics/page-view-beacon";
import { GoogleTranslate } from "@/components/i18n/google-translate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { MobileStickyCta } from "@/components/ux/mobile-sticky-cta";
import { brand } from "@/config/brand";
import { getSession } from "@/lib/auth";
import "./globals.css";

const display = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin-wght-normal.woff2",
      weight: "500 700",
      style: "normal",
    },
    {
      path: "../fonts/fraunces-latin-ext-wght-normal.woff2",
      weight: "500 700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const body = localFont({
  src: [
    {
      path: "../fonts/manrope-latin-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../fonts/manrope-latin-ext-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../fonts/manrope-cyrillic-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../fonts/manrope-vietnamese-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} · Cambodia real estate since ${brand.foundedYear}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    title: `${brand.name} · ${brand.fullName}`,
    description: brand.description,
    siteName: brand.name,
    locale: "en_US",
    type: "website",
    url: brand.url,
    images: [{ url: "/brand/seaps-logo.png", alt: brand.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
    images: ["/brand/seaps-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/brand/seaps-logo.png", type: "image/png" }],
    apple: [{ url: "/brand/seaps-logo.png" }],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} translate="yes">
      <body className="flex min-h-full flex-col pb-20 md:pb-0">
        <OrganizationJsonLd />
        <Script src="/scripts/seaps-lang-boot.js" strategy="beforeInteractive" />
        <GoogleTranslate />
        <PageViewBeacon />
        <SiteHeader userName={session?.name} userRole={session?.role} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileStickyCta />
        <CookieBanner />
      </body>
    </html>
  );
}

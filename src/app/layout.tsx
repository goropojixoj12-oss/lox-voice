import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { GoogleTranslate } from "@/components/i18n/google-translate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} · International real estate marketplace`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    title: brand.name,
    description: brand.description,
    siteName: brand.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} translate="yes">
      <body className="flex min-h-full flex-col">
        <Script src="/scripts/seaps-lang-boot.js" strategy="beforeInteractive" />
        <GoogleTranslate />
        <SiteHeader userName={session?.name} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

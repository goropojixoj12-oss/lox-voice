import Link from "next/link";
import { brand } from "@/config/brand";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/buy", label: "Buy" },
      { href: "/rent", label: "Rent" },
      { href: "/short-stay", label: "Short stay" },
      { href: "/projects", label: "New homes" },
      { href: "/commercial", label: "Commercial" },
      { href: "/land", label: "Land" },
      { href: "/map", label: "Map search" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { href: "/agencies", label: "Agencies" },
      { href: "/list-property", label: "List a property" },
      { href: "/dashboard", label: "Owner & agent desk" },
      { href: "/admin", label: "Admin" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/insights", label: "Market insights" },
      { href: "/guides", label: "Buyer & renter guides" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-primary)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl">{brand.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{brand.tagline}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-accent-soft)]">
            Demo marketplace · sample inventory
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {brand.name}. Built as an original product concept.</p>
          <p>Images from Unsplash for demonstration only</p>
        </div>
      </div>
    </footer>
  );
}

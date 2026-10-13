import Link from "next/link";
import { SeapsLogo } from "@/components/brand/seaps-logo";
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
    <footer className="mt-auto overflow-hidden border-t border-[var(--color-border)] bg-[#050d18] text-[var(--color-text)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div className="min-w-0">
          <SeapsLogo variant="image" className="max-w-full" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            {brand.fullName} · Cambodia · since {brand.foundedYear}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Property search across Cambodia
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-accent-soft)]">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-accent-soft)]"
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
      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {brand.foundedYear}–{new Date().getFullYear()} {brand.name}. {brand.fullName}.
          </p>
          <p>Phnom Penh · Siem Reap · Sihanoukville · Kampot · Kep</p>
        </div>
      </div>
    </footer>
  );
}

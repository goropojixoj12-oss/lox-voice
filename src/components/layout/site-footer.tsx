import Link from "next/link";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { BackgroundVideo } from "@/components/shared/background-video";
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
      { href: "/usefullinks", label: "Useful Links" },
      { href: "/list-property", label: "List a property" },
      { href: "/dashboard", label: "Owner & agent desk" },
      { href: "/auth/login", label: "Sign in" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/insights", label: "Market insights" },
      { href: "/guides", label: "Buyer & renter guides" },
      { href: "/about", label: "About Us" },
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
    <footer className="relative mt-auto overflow-hidden border-t border-[var(--color-border)] text-[var(--color-text)]">
      <BackgroundVideo
        src="/videos/footer-banner.mp4"
        mobileSrc="/videos/footer-banner-mobile.mp4"
        poster="/videos/footer-banner.jpg"
        overlayClassName="bg-[linear-gradient(180deg,rgba(5,13,24,0.92)_0%,rgba(5,13,24,0.88)_55%,rgba(5,13,24,0.95)_100%)]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div className="min-w-0">
          <SeapsLogo size="footer" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            {brand.fullName} · Cambodia · since {brand.foundedYear}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Property search across Cambodia
          </p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            <a
              href={`mailto:${brand.supportEmail}`}
              className="font-medium text-[var(--color-accent-soft)] underline-offset-2 hover:underline"
            >
              {brand.supportEmail}
            </a>
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
      <div className="relative border-t border-[var(--color-border)]/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {brand.foundedYear}–{new Date().getFullYear()} {brand.name}. {brand.fullName}. See{" "}
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            .
          </p>
          <p>Phnom Penh · Siem Reap · Sihanoukville · Kampot · Kep</p>
        </div>
      </div>
    </footer>
  );
}

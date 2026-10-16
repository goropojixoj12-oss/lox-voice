import Link from "next/link";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { BackgroundVideo } from "@/components/shared/background-video";
import { primaryNav } from "@/components/layout/site-nav-config";
import { brand } from "@/config/brand";

const linkClass =
  "text-sm text-[var(--color-muted)] transition hover:text-[var(--color-accent-soft)]";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[var(--color-border)] text-[var(--color-text)]">
      <BackgroundVideo
        src="/videos/footer-banner.mp4"
        mobileSrc="/videos/footer-banner-mobile.mp4"
        poster="/videos/footer-banner.jpg"
        overlayClassName="bg-[linear-gradient(180deg,rgba(5,13,24,0.92)_0%,rgba(5,13,24,0.88)_55%,rgba(5,13,24,0.95)_100%)]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1.4fr] lg:px-8">
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
        <div className="grid min-w-0 gap-10 sm:grid-cols-2">
          <nav aria-label="Footer menu">
            <p className="text-sm font-semibold text-[var(--color-accent-soft)]">Menu</p>
            <ul className="mt-3 space-y-3">
              {primaryNav.map((entry) =>
                entry.type === "link" ? (
                  <li key={entry.href}>
                    <Link href={entry.href} className={linkClass}>
                      {entry.label}
                    </Link>
                  </li>
                ) : (
                  <li key={entry.label}>
                    <Link href={entry.href} className={`${linkClass} font-medium text-[var(--color-text)]`}>
                      {entry.label}
                    </Link>
                    <ul className="mt-1.5 space-y-1.5 border-l border-[var(--color-border)] pl-3">
                      {entry.items.map((item) => (
                        <li key={item.href + item.label}>
                          <Link href={item.href} className={linkClass}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <p className="text-sm font-semibold text-[var(--color-accent-soft)]">Legal</p>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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

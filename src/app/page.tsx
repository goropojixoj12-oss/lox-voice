import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/article/article-card";
import { AgencyCard } from "@/components/agency/agency-card";
import { ProjectCard } from "@/components/project/project-card";
import { PropertyCard, PropertyGrid } from "@/components/property/property-card";
import { MainSearch } from "@/components/search/main-search";
import { BackgroundVideo } from "@/components/shared/background-video";
import { Section, SectionHeader } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";
import { agencies } from "@/data/agencies";
import { articles } from "@/data/articles";
import { cities } from "@/data/locations";
import { marketStats, popularDistrictPrices } from "@/data/market";
import { projects } from "@/data/projects";
import { properties } from "@/data/properties";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { brand } from "@/config/brand";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  const newest = [...properties]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 3);
  const featured = properties.filter((p) => p.isFeatured).slice(0, 3);
  const premium = properties.filter((p) => p.isPremium).slice(0, 3);
  const videoTours = properties.filter((p) => p.hasVideoTour).slice(0, 3);
  const guides = articles.filter((a) => a.category === "guides" || a.category === "investor");

  return (
    <>
      <section className="relative min-h-[min(88vh,820px)] overflow-hidden">
        <BackgroundVideo
          eager
          src="/videos/hero-banner.mp4"
          mobileSrc="/videos/hero-banner-mobile.mp4"
          poster="/videos/hero-banner.jpg"
          overlayClassName="bg-[linear-gradient(105deg,rgba(7,17,31,0.9)_0%,rgba(11,28,51,0.7)_48%,rgba(11,28,51,0.4)_100%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="reveal text-white">
            <SeapsLogo size="hero" />
            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">
              {brand.fullName}
            </p>
            <h1 className="mt-5 max-w-xl text-2xl font-medium leading-snug text-white/92 md:text-3xl">
              Cambodia property marketplace — buy, rent, or list with local expertise since{" "}
              {brand.foundedYear}
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/75 md:text-lg">
              Verified listing signals, city and district filters, and agent desks across Phnom Penh,
              Siem Reap, and the coast — one search for homes, commercial, and off-plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/buy" variant="accent">
                Start property search
              </ButtonLink>
              <ButtonLink
                href="/list-property"
                variant="ghost"
                className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                List your property
              </ButtonLink>
            </div>
          </div>
          <div className="reveal self-end">
            <MainSearch />
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { href: "/buy?type=apartment", label: "Apartments" },
                { href: "/buy?type=villa", label: "Villas" },
                { href: "/rent", label: "Long-term rent" },
                { href: "/projects", label: "New projects" },
                { href: "/locations/phnom-penh", label: "Phnom Penh" },
                { href: "/locations/siem-reap", label: "Siem Reap" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/25"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeader
          eyebrow="Curated stock"
          title="Recommended properties"
          description="Recently added, featured, and premium homes across Cambodia with working favorites and filters."
          action={
            <ButtonLink href="/search" variant="outline">
              View all listings
            </ButtonLink>
          }
        />
        <div className="space-y-10">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Recently added
            </h3>
            <PropertyGrid items={newest} userId={session?.id} />
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Featured
            </h3>
            <div className="grid gap-5 md:grid-cols-3">
              {featured.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="editorial"
                  userId={session?.id}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Premium
            </h3>
            <PropertyGrid items={premium} userId={session?.id} />
          </div>
        </div>
      </Section>

      <Section className="bg-[#050d18] text-white">
        <SectionHeader
          eyebrow="Geography"
          title="Popular cities and districts"
          description="Popular Cambodian cities and districts with active listing counts."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/locations/${city.slug}`}
              className="group relative overflow-hidden rounded-[var(--radius-xl)]"
            >
              <div className="relative aspect-[5/4]">
                <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  sizes="33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">{city.country}</p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-3xl">{city.name}</h3>
                <p className="mt-2 text-sm text-white/80">
                  {city.listingCount} listings · {city.blurb}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Developments"
          title="New residential projects"
          description="Off-plan and new communities with separated developer claims and moderated facts."
          action={
            <ButtonLink href="/projects" variant="outline">
              Browse projects
            </ButtonLink>
          }
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Section>

      <Section className="bg-[var(--color-mist)]/70">
        <SectionHeader
          eyebrow="Market pulse"
          title="Cambodia market indicators"
          description="Asking-price snapshots from current SEAPS listings across major Cambodian cities."
          action={
            <ButtonLink href="/insights" variant="outline">
              Read insights
            </ButtonLink>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {marketStats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {stat.label}
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-[var(--color-accent)]">{stat.change}</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{stat.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm font-semibold">
            Popular districts · $/m²
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {popularDistrictPrices.map((row) => (
              <li key={row.district} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  {row.district}, {row.city}
                </span>
                <span className="font-semibold text-[var(--color-accent-soft)]">{row.pricePerSqm}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Video-ready"
          title="Listings with video tours"
          description="Properties with video tours available for remote viewing."
        />
        <PropertyGrid items={videoTours} userId={session?.id} />
      </Section>

      <Section className="bg-[var(--color-secondary)]/50">
        <SectionHeader
          eyebrow="Professionals"
          title="Popular agencies"
          description="Verified and pending agency profiles with specializations and territory notes."
          action={
            <ButtonLink href="/agencies" variant="outline">
              Agency directory
            </ButtonLink>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {agencies.map((agency) => (
            <AgencyCard key={agency.id} agency={agency} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader
              eyebrow="Editorial"
              title="Guides and market notes"
              description="Buyer guidance and analysis pages with unique copy — not auto-generated SEO filler."
            />
            <div className="space-y-6">
              {guides.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
              Request a tailored shortlist
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Tell us the city, budget, and must-have amenities. Our team will follow up with a
              shortlist — with privacy consent on the contact form.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-muted)]">
              <li>· City and district preferences</li>
              <li>· Budget and deal type (buy / rent / short stay)</li>
              <li>· Must-have amenities and timeline</li>
            </ul>
            <ButtonLink href="/contact" variant="primary" className="mt-6 w-full min-h-11">
              Contact SEAPS for a shortlist
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section className="pb-24">
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-accent)]/30 bg-[linear-gradient(135deg,#0b1c33,#122844_55%,#0b1c33)] px-6 py-12 text-white md:px-10 seaps-gold-border">
          <div className="grid gap-6 md:grid-cols-[1.2fr_auto] md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)] md:text-4xl">
                Ready to publish your property?
              </h2>
              <p className="mt-3 max-w-xl text-[var(--color-muted)]">
                Use the multi-step listing wizard to draft, preview, and submit your Cambodian
                property for moderation.
              </p>
            </div>
            <ButtonLink href="/list-property" variant="accent" size="lg">
              Start listing
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

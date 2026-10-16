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
      <section className="relative min-h-[min(84vh,780px)] overflow-hidden">
        <BackgroundVideo
          eager
          src="/videos/hero-banner.mp4"
          mobileSrc="/videos/hero-banner-mobile.mp4"
          poster="/videos/hero-banner.jpg"
          overlayClassName="bg-[linear-gradient(105deg,rgba(7,17,31,0.9)_0%,rgba(11,28,51,0.7)_48%,rgba(11,28,51,0.4)_100%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-14 sm:px-6 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10 lg:px-8 lg:pt-14 lg:pb-16">
          <div className="reveal min-w-0 text-white">
            <div className="flex w-full flex-col items-center text-center">
              <SeapsLogo
                size="hero"
                className="h-[4.25rem] w-[6.75rem] sm:h-20 sm:w-32 md:h-[5.5rem] md:w-[8.75rem]"
              />
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[var(--color-accent-soft)] sm:mt-4">
                {brand.fullName}
              </p>
            </div>
            <h1 className="mt-5 max-w-2xl text-2xl font-medium leading-snug text-white/92 md:text-3xl">
              South East Asia Property Services (SEAPS) is a multi-Award-Winning Real Estate,
              Property Management and Investment Company, based in South East Asia.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">
              SEAPS converts market insight into clear individualised strategies by providing Buyers,
              Sellers and Investors with comprehensive property solutions spanning every major sector
              of the market, including Land, Residential and Commercial Properties, Property
              Management, Sales, Rentals, Investment Holdings and Property Development Opportunities.
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
          <div className="reveal w-full self-end lg:justify-self-end">
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
            <div className="grid items-stretch gap-5 md:grid-cols-3">
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

      <Section>
        <SectionHeader
          eyebrow="Geography"
          title="Popular cities and districts"
          description="Popular Cambodian cities and districts with active listing counts."
        />
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/locations/${city.slug}`}
              className="seaps-card group relative overflow-hidden rounded-[var(--radius-xl)]"
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
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Section>

      <Section>
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
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {marketStats.map((stat) => (
            <div
              key={stat.id}
              className="seaps-card rounded-[var(--radius-lg)] p-5"
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
        <div className="seaps-card mt-8 overflow-hidden rounded-[var(--radius-lg)]">
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

      <Section>
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
        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
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
          <div className="seaps-card rounded-[var(--radius-xl)] p-6">
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
        <div className="seaps-card overflow-hidden rounded-[var(--radius-xl)] px-6 py-12 md:px-10">
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

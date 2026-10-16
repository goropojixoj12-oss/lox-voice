import Image from "next/image";
import { ArticleCard } from "@/components/article/article-card";
import { ProjectCard } from "@/components/project/project-card";
import { PropertyCard, PropertyGrid } from "@/components/property/property-card";
import { HeroPromoButtons } from "@/components/home/hero-promo-buttons";
import { HeroSocialLinks } from "@/components/home/hero-social-links";
import { MainSearch } from "@/components/search/main-search";
import { BackgroundVideo } from "@/components/shared/background-video";
import { Section, SectionHeader } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";
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
      <section className="relative z-0 min-h-[min(84vh,780px)] overflow-hidden">
        <BackgroundVideo
          eager
          src="/videos/hero-banner.mp4"
          mobileSrc="/videos/hero-banner-mobile.mp4"
          poster="/videos/hero-banner.jpg"
          overlayClassName="bg-[linear-gradient(105deg,rgba(7,17,31,0.9)_0%,rgba(11,28,51,0.7)_48%,rgba(11,28,51,0.4)_100%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-14 sm:px-6 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10 lg:px-8 lg:pt-14 lg:pb-16">
          <div className="reveal min-w-0 text-white">
            <div className="notranslate flex w-full flex-col items-center text-center">
              <SeapsLogo
                size="hero"
                className="h-[4.25rem] w-[6.75rem] sm:h-20 sm:w-32 md:h-[5.5rem] md:w-[8.75rem]"
              />
              <p className="seaps-brand-subtitle mt-3 text-sm uppercase tracking-[0.2em] sm:mt-4">
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
            <HeroSocialLinks />
          </div>
          <div className="reveal w-full self-end lg:justify-self-end">
            <HeroPromoButtons />
            <MainSearch />
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
          description="Six Cambodian cities and districts featured on SEAPS."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cities.slice(0, 6).map((city) => (
            <div
              key={city.slug}
              className="relative overflow-hidden rounded-[var(--radius-xl)]"
              aria-label={city.name}
            >
              <div className="relative aspect-[5/4]">
                <Image
                  src={city.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-white">
                  {city.name}
                </h3>
              </div>
            </div>
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  PropertyListingInquiry,
  propertyListingInquiryFromProperty,
} from "@/components/forms/property-listing-inquiry";
import { FavoriteButton } from "@/components/property/favorite-button";
import { OpenPresentationButton } from "@/components/property/open-presentation-button";
import { PriceDisplay } from "@/components/property/price-display";
import { PropertyDescriptionSection } from "@/components/property/property-description-section";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyPresentation } from "@/components/property/property-presentation";
import { PropertyGrid } from "@/components/property/property-card";
import { PropertyMap } from "@/components/search/property-map";
import { ParallaxSection } from "@/components/shared/parallax-section";
import { BreadcrumbJsonLd, PropertyJsonLd } from "@/components/seo/json-ld";
import { PropertyInquiryLanguageActions } from "@/components/forms/property-inquiry-language-actions";
import { Section } from "@/components/shared/section";
import { AgentListingSnippet } from "@/components/agency/agent-listing-snippet";
import { getAgentById } from "@/data/agencies";
import { getProjectById } from "@/data/projects";
import {
  getPropertyBySlug,
  getRelatedProperties,
} from "@/data/properties";
import { getAllProperties } from "@/lib/catalog";
import { hasMapCoords } from "@/lib/property-coords";
import { getSession } from "@/lib/auth";
import { canViewListing, isPublicListing } from "@/lib/listing-access";
import {
  amenityLabels,
  furnishingLabels,
  propertyTypeLabels,
  transactionLabels,
  verificationLabels,
} from "@/lib/labels";
import { daysAgo } from "@/lib/utils";

const HERO_HEADLINE_MAX = 84;

/**
 * A listing title is often a whole sales sentence ("The cheapest studio ever
 * sold at Vue Aston ... contact Adam"). The hero needs a headline, so the text
 * is cut at a word boundary and its last words are handed back for the gold
 * italic accent.
 */
function heroHeadline(text: string): { lead: string; tail: string } {
  const clean = text.replace(/\s+/g, " ").trim();
  const needsCut = clean.length > HERO_HEADLINE_MAX;
  let base = clean;
  if (needsCut) {
    // Cut at a word boundary, then drop a dangling one- or two-letter word so
    // the headline never ends on "A..." or "of...".
    base = `${clean
      .slice(0, clean.lastIndexOf(" ", HERO_HEADLINE_MAX))
      .replace(/[\s.,;:–—-]+$/, "")
      .replace(/\s+\S{1,2}$/, "")
      .replace(/[\s.,;:–—-]+$/, "")}…`;
  }
  const words = base.split(" ");
  const tailCount = words.length > 6 ? 3 : words.length > 3 ? 2 : 0;
  return {
    lead: words.slice(0, words.length - tailCount).join(" "),
    tail: words.slice(words.length - tailCount).join(" "),
  };
}

export async function generateStaticParams() {
  const all = await getAllProperties();
  return all.filter((p) => isPublicListing(p)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const all = await getAllProperties();
  const property = all.find((p) => p.slug === slug) ?? getPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };
  if (!isPublicListing(property)) {
    return {
      title: "Listing preview",
      robots: { index: false, follow: false },
    };
  }
  const path = `/property/${property.slug}`;
  return {
    title: property.title,
    description: property.summary,
    alternates: { canonical: path },
    openGraph: {
      title: property.title,
      description: property.summary,
      url: path,
      images: property.images[0]
        ? [{ url: property.images[0].url, alt: property.images[0].alt || property.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: property.summary,
      images: property.images[0] ? [property.images[0].url] : undefined,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all = await getAllProperties();
  const property = all.find((p) => p.slug === slug) ?? getPropertyBySlug(slug);
  if (!property) notFound();

  const session = await getSession();
  if (!canViewListing(property, session)) notFound();
  const agent = property.agentId ? getAgentById(property.agentId) : undefined;
  const project = property.projectId ? getProjectById(property.projectId) : undefined;
  const related = getRelatedProperties(property, 3, all);
  const showPublicSeo = isPublicListing(property);
  const headline = heroHeadline(property.title);
  const cover = property.images?.[0];

  const heroFacts: Array<[string, string]> = [];
  if (property.bedrooms !== null) {
    heroFacts.push(["Bedrooms", property.bedrooms === 0 ? "Studio" : String(property.bedrooms)]);
  }
  if (property.bathrooms !== null) heroFacts.push(["Bathrooms", String(property.bathrooms)]);
  if (property.areaSqm) heroFacts.push(["Interior", `${property.areaSqm} m²`]);
  if (property.landSqm) heroFacts.push(["Land", `${property.landSqm} m²`]);

  return (
    <>
      <ParallaxSection
        imageUrl={cover?.url}
        alt={cover?.alt || property.title}
        priority
        className="flex min-h-[92svh] w-full flex-col justify-end"
        contentClassName="mx-auto w-full max-w-7xl px-4 pb-12 pt-32 sm:px-6 sm:pb-16 lg:px-8"
      >
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(11,28,51,0.55)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-soft)] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            {transactionLabels[property.transactionType]} ·{" "}
            {propertyTypeLabels[property.propertyType]}
          </p>

          <h1 className="mt-5 line-clamp-3 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.3vw,3.4rem)] font-normal leading-[1.06] text-balance text-white">
            {headline.lead}{" "}
            <span className="italic text-[var(--color-accent)]">{headline.tail}</span>
          </h1>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
            {[property.location.district, property.location.city].filter(Boolean).join(" · ")}
          </p>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {property.summary}
          </p>

          <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4">
            <PriceDisplay
              property={property}
              className="text-3xl font-semibold tracking-tight text-[var(--color-accent-soft)] sm:text-4xl"
            />
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/70">
              {heroFacts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {property.images?.length ? (
              <OpenPresentationButton slides={property.images.length} />
            ) : null}
            <a
              href="#enquiry"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-soft)]"
            >
              Enquire about this home
            </a>
            {property.images?.length ? (
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline"
              >
                {property.images.length} photos
              </a>
            ) : null}
          </div>
        </div>

        <p className="mt-10 hidden text-[10px] uppercase tracking-[0.32em] text-white/35 sm:block">
          Scroll to explore
        </p>
      </ParallaxSection>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!showPublicSeo ? (
        <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-warning)]/40 bg-[var(--color-mist)] px-4 py-3 text-sm text-[var(--color-text)]">
          This listing is <strong>{property.status}</strong> and is not visible in public search until
          an admin approves it.
        </p>
      ) : null}
      {showPublicSeo ? (
        <>
          <PropertyJsonLd
            title={property.title}
            description={property.summary}
            url={`/property/${property.slug}`}
            image={property.images[0]?.url}
            price={property.price}
            currency={property.currency}
            locality={property.location.district}
            region={property.location.city}
          />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: "/" },
              { name: "Search", url: "/search" },
              { name: property.location.city, url: `/locations/${property.location.citySlug}` },
              { name: property.title, url: `/property/${property.slug}` },
            ]}
          />
        </>
      ) : null}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:text-[var(--color-accent-soft)]">
          Home
        </Link>
        <span>/</span>
        <Link href="/search" className="hover:text-[var(--color-accent-soft)]">
          Search
        </Link>
        <span>/</span>
        <Link
          href={`/locations/${property.location.citySlug}`}
          className="hover:text-[var(--color-accent-soft)]"
        >
          {property.location.city}
        </Link>
        <span>/</span>
        <span aria-current="page">{property.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="min-w-0 space-y-8">
          <div id="gallery" className="scroll-mt-24">
            <PropertyGallery images={property.images} listingSlug={property.slug} />
          </div>
          {property.images?.length ? <PropertyPresentation property={property} /> : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[var(--color-mist)] px-3 py-1">
                {verificationLabels[property.verification]}
              </span>
              <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                {transactionLabels[property.transactionType]}
              </span>
              <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                Updated {daysAgo(property.updatedAt)}
              </span>
            </div>
            <FavoriteButton propertyId={property.id} userId={session?.id} />
          </div>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
              Overview
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Bedrooms", property.bedrooms === 0 ? "Studio" : property.bedrooms],
                ["Bathrooms", property.bathrooms],
                ["Interior", property.areaSqm ? `${property.areaSqm} m²` : null],
                ["Land", property.landSqm ? `${property.landSqm} m²` : null],
                [
                  "Furnishing",
                  property.furnishing ? furnishingLabels[property.furnishing] : null,
                ],
              ]
                .filter(([label, value]) => label !== "Seller" && value !== null && value !== undefined)
                .map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold capitalize">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <PropertyDescriptionSection description={property.description} />

          {property.amenities.length ? (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Amenities
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-black"
                  >
                    {amenityLabels[amenity]}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {session && (session.role === "admin" || session.role === "agent") ? (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-mist)]/30 p-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Internal info
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Only visible to signed-in staff members.
              </p>

              {property.assignedAgentId ? (
                <p className="mt-3 text-sm">
                  <span className="font-semibold">Assigned agent:</span>{" "}
                  {property.assignedAgentId}
                </p>
              ) : null}

              {(session.role === "admin" || session.role === "agent") && property.commissionAgent ? (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Agent commission:</span>{" "}
                  {property.commissionAgent}%
                </p>
              ) : null}

              {session.role === "admin" && property.commissionCompany ? (
                <p className="mt-1 text-sm text-red-600">
                  <span className="font-semibold">Company income:</span>{" "}
                  {property.commissionCompany}% (admin only)
                </p>
              ) : null}

              {(property.notes?.length ?? 0) > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Notes</p>
                  <ul className="mt-2 space-y-2">
                    {(property.notes ?? [])
                      .filter((n) => {
                        if (session.role === "admin") return true;
                        return n.visibility === "staff" || n.visibility === "public" || n.authorId === session.id;
                      })
                      .map((note) => (
                        <li
                          key={note.id}
                          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                        >
                          <p className="whitespace-pre-wrap">{note.text}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            {note.authorName} ·{" "}
                            {new Date(note.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {(property.documents?.length ?? 0) > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Documents</p>
                  <ul className="mt-2 space-y-2">
                    {(property.documents ?? [])
                      .filter((d) => {
                        if (session.role === "admin") return true;
                        return d.access === "staff" || d.access === "public";
                      })
                      .map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                        >
                          <span className="truncate font-medium">{doc.name}</span>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[#0B1C33]"
                          >
                            Download
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {(property.documents ?? []).filter((d) => d.access === "public").length > 0 && !session ? (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Documents
              </h2>
              <ul className="mt-3 space-y-2">
                {(property.documents ?? [])
                  .filter((d) => d.access === "public")
                  .map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                    >
                      <span className="truncate font-medium">{doc.name}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[#0B1C33]"
                      >
                        Download
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
              Location
            </h2>
            {hasMapCoords(property) ? (
              <PropertyMap items={[property]} activeId={property.id} />
            ) : (
              <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
                {property.location.address} · {property.location.district},{" "}
                {property.location.city}
              </p>
            )}
          </section>
        </div>

        <aside id="enquiry" className="scroll-mt-24 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PropertyListingInquiry {...propertyListingInquiryFromProperty(property)} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <PropertyInquiryLanguageActions listingSlug={property.slug} />
          </div>
          {agent ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <AgentListingSnippet
                agent={agent}
                listedByName="ADAM CREEK"
                listedByTitle="CEO"
              />
            </div>
          ) : null}
          {project ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Project</p>
              <Link href={`/projects/${project.slug}`} className="mt-1 block font-semibold">
                {project.name}
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <Section className="px-0">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            Similar listings
          </h2>
          <PropertyGrid items={related} userId={session?.id} />
        </Section>
      ) : null}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { FavoriteButton } from "@/components/property/favorite-button";
import { PriceDisplay } from "@/components/property/price-display";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyGrid } from "@/components/property/property-card";
import { PropertyMap } from "@/components/search/property-map";
import { BreadcrumbJsonLd, PropertyJsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";
import { AgentListingSnippet } from "@/components/agency/agent-listing-snippet";
import { getAgentById } from "@/data/agencies";
import { getProjectById } from "@/data/projects";
import {
  getPropertyBySlug,
  getRelatedProperties,
} from "@/data/properties";
import { getAllProperties } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { canViewListing, isPublicListing } from "@/lib/listing-access";
import {
  amenityLabels,
  furnishingLabels,
  propertyTypeLabels,
  transactionLabels,
  verificationLabels,
} from "@/lib/labels";
import { propertyListingsEnabled } from "@/lib/listings-policy";
import { daysAgo } from "@/lib/utils";

export async function generateStaticParams() {
  if (!propertyListingsEnabled()) {
    return [];
  }
  const all = await getAllProperties();
  return all.filter((p) => isPublicListing(p)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!propertyListingsEnabled()) {
    return { title: "Property not found" };
  }
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
  if (!propertyListingsEnabled()) {
    notFound();
  }
  const { slug } = await params;
  const all = await getAllProperties();
  const property = all.find((p) => p.slug === slug) ?? getPropertyBySlug(slug);
  if (!property) notFound();

  const session = await getSession();
  if (!canViewListing(property, session)) notFound();
  const agent = property.agentId ? getAgentById(property.agentId) : undefined;
  const project = property.projectId ? getProjectById(property.projectId) : undefined;
  const related = getRelatedProperties(property);
  const showPublicSeo = isPublicListing(property);

  return (
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
        <div className="space-y-8">
          <PropertyGallery images={property.images} />
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  {transactionLabels[property.transactionType]} ·{" "}
                  {propertyTypeLabels[property.propertyType]}
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
                  {property.title}
                </h1>
                <p className="mt-2 text-[var(--color-muted)]">
                  {property.location.address} · {property.location.district},{" "}
                  {property.location.city}
                </p>
              </div>
              <FavoriteButton propertyId={property.id} userId={session?.id} />
            </div>
            <PriceDisplay
              property={property}
              className="mt-4 text-3xl font-semibold text-[var(--color-accent-soft)]"
            />
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[var(--color-mist)] px-3 py-1">
                {verificationLabels[property.verification]}
              </span>
              <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                Updated {daysAgo(property.updatedAt)}
              </span>
            </div>
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
                ["Seller", property.sellerType],
              ]
                .filter(([, value]) => value !== null && value !== undefined)
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

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
              Description
            </h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-[var(--color-muted)]">
              {property.description}
            </p>
          </section>

          {property.amenities.length ? (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Amenities
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm"
                  >
                    {amenityLabels[amenity]}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
              Location
            </h2>
            <PropertyMap items={[property]} activeId={property.id} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InquiryForm propertyId={property.id} propertyTitle={property.title} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="font-semibold text-[var(--color-accent-soft)]">Share</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Copy the page URL from your browser to share this listing, or use the inquiry form
              to request a viewing.
            </p>
            <ButtonLink href={`/search?city=${property.location.citySlug}`} variant="outline" className="mt-3 w-full">
              More in {property.location.city}
            </ButtonLink>
          </div>
          {agent ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <AgentListingSnippet agent={agent} />
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

      <Section className="px-0">
        <h2 className="mb-5 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Similar listings
        </h2>
        <PropertyGrid items={related} userId={session?.id} />
      </Section>
    </div>
  );
}

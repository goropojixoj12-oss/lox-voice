import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGrid } from "@/components/property/property-card";
import { cities, getCity } from "@/data/locations";
import { getSession } from "@/lib/auth";
import { searchProperties } from "@/lib/search";
import { getAllProperties } from "@/lib/catalog";

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const guide = getCity(city);
  if (!guide) return { title: "City not found" };
  return {
    title: `${guide.name} real estate`,
    description: guide.blurb,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const guide = getCity(city);
  if (!guide) notFound();
  const session = await getSession();
  const all = await getAllProperties();
  const result = searchProperties({ city: guide.slug, pageSize: 9 }, all);

  return (
    <div>
      <div className="relative h-64 md:h-80">
        <Image src={guide.image} alt={guide.name} fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[var(--color-primary)]/55" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/75">{guide.country}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl">{guide.name}</h1>
            <p className="mt-3 max-w-2xl text-white/85">{guide.blurb}</p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            Districts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guide.districts.map((district) => (
              <Link
                key={district.slug}
                href={`/locations/${guide.slug}/${district.slug}`}
                className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={district.image}
                    alt={district.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{district.name}</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {district.listingCount} demo listings
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
              Listings in {guide.name}
            </h2>
            <Link href={`/search?city=${guide.slug}`} className="text-sm font-semibold text-[var(--color-accent)]">
              Open full search
            </Link>
          </div>
          <PropertyGrid items={result.items} userId={session?.id} />
        </section>
      </div>
    </div>
  );
}

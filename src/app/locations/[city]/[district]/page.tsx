import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGrid } from "@/components/property/property-card";
import { cities, getCity, getDistrict } from "@/data/locations";
import { getAllProperties } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { searchProperties } from "@/lib/search";

export function generateStaticParams() {
  return cities.flatMap((city) =>
    city.districts.map((district) => ({ city: city.slug, district: district.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; district: string }>;
}): Promise<Metadata> {
  const { city, district } = await params;
  const cityGuide = getCity(city);
  const districtGuide = getDistrict(city, district);
  if (!cityGuide || !districtGuide) return { title: "District not found" };
  return {
    title: `${districtGuide.name}, ${cityGuide.name}`,
    description: `Demo property listings in ${districtGuide.name}, ${cityGuide.name}.`,
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ city: string; district: string }>;
}) {
  const { city, district } = await params;
  const cityGuide = getCity(city);
  const districtGuide = getDistrict(city, district);
  if (!cityGuide || !districtGuide) notFound();
  const session = await getSession();
  const all = await getAllProperties();
  const result = searchProperties(
    { city: cityGuide.slug, district: districtGuide.slug, pageSize: 12 },
    all,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-sm text-[var(--color-muted)]">
            <Link href={`/locations/${cityGuide.slug}`}>{cityGuide.name}</Link> / {districtGuide.name}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-primary)]">
            {districtGuide.name}
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            Editorial district page with {result.total} matching demo listings. Content stays specific
            rather than auto-generated filler.
          </p>
          <Link
            href={`/search?city=${cityGuide.slug}&district=${districtGuide.slug}`}
            className="mt-4 inline-block text-sm font-semibold text-[var(--color-accent)]"
          >
            Open filtered search
          </Link>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)]">
          <Image
            src={districtGuide.image}
            alt={districtGuide.name}
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </div>
      <PropertyGrid items={result.items} userId={session?.id} />
    </div>
  );
}

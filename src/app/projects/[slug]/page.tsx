import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { PropertyGrid } from "@/components/property/property-card";
import { PropertyMap } from "@/components/search/property-map";
import { amenityLabels } from "@/lib/labels";
import { getProjectBySlug, projects } from "@/data/projects";
import { getPropertiesByProject } from "@/data/properties";
import { formatPrice } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.name, description: project.summary };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const units = getPropertiesByProject(project.id);
  const session = await getSession();
  const cover = project.images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-[var(--radius-xl)]">
        <Image src={cover.url} alt={cover.alt} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 p-6 text-white md:p-10">
          <p className="text-xs uppercase tracking-[0.16em] text-white/75">{project.developer}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            {project.name}
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">{project.summary}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Price range",
                `${formatPrice(project.priceFrom, project.currency)} – ${formatPrice(project.priceTo, project.currency)}`,
              ],
              ["Areas", `${project.areasFrom}–${project.areasTo} m²`],
              ["Stage", project.constructionStage],
              [
                "Completion",
                new Date(project.completionDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                }),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
                <p className="mt-1 font-semibold capitalize">{value}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)]">
              Concept
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--color-muted)]">{project.description}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="font-semibold text-[var(--color-primary)]">Verified / moderated notes</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-muted)]">
                {project.verifiedFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="font-semibold text-[var(--color-primary)]">Developer-provided claims</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-muted)]">
                {project.developerClaims.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)]">
              Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.amenities.map((a) => (
                <span key={a} className="rounded-full bg-[var(--color-mist)] px-3 py-1 text-sm">
                  {amenityLabels[a]}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)]">
              Available units
            </h2>
            {units.length ? (
              <PropertyGrid items={units} userId={session?.id} />
            ) : (
              <p className="text-[var(--color-muted)]">
                No individual units published yet. Use the inquiry form for availability.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)]">
              Location
            </h2>
            <PropertyMap
              items={units.length ? units : []}
              activeId={units[0]?.id}
            />
            {!units.length ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {project.location.district}, {project.location.city} · {project.location.address}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InquiryForm propertyId={project.id} propertyTitle={`${project.name} project inquiry`} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
            Brochures and document downloads require object storage configuration. No fake PDF is
            linked in this demo.
            <Link href="/contact" className="mt-2 block text-[var(--color-accent)]">
              Contact EstateNova
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

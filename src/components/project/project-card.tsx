import Image from "next/image";
import Link from "next/link";
import type { DevelopmentProject } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ProjectCard({ project }: { project: DevelopmentProject }) {
  const cover = project.images.find((i) => i.isCover) ?? project.images[0];
  return (
    <article className="seaps-card h-full overflow-hidden rounded-[var(--radius-xl)]">
      <Link href={`/projects/${project.slug}`} className="relative block aspect-[16/11]">
        <Image src={cover.url} alt={cover.alt} fill className="object-cover" sizes="33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-white/80">{project.developer}</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl">{project.name}</h3>
        </div>
      </Link>
      <div className="space-y-2 p-5">
        <p className="text-sm text-[var(--color-muted)]">
          {project.location.district}, {project.location.city}
        </p>
        <p className="font-semibold text-[var(--color-accent-soft)]">
          {formatPrice(project.priceFrom, project.currency)} –{" "}
          {formatPrice(project.priceTo, project.currency)}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Stage: {project.constructionStage} · Target completion{" "}
          {new Date(project.completionDate).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import { ProjectCard } from "@/components/project/project-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "New homes & developments",
  description: "Browse residential projects with construction stages and unit ranges.",
};

export default function ProjectsPage() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Developments"
        title="New homes and residential projects"
        description="Each project page separates moderated facts from developer-provided claims."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import { CareersApplyCta } from "@/components/careers/careers-apply-cta";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Career opportunities at South East Asia Property Services (SEAPS) — expressions of interest and CV submissions across Cambodia and South East Asia.",
};

export default function CareersPage() {
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Careers
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--color-accent-soft)] md:text-5xl">
          Career Opportunities at South East Asia Property Services (SEAPS)
        </h1>
        <p className="seaps-brand-subtitle mt-4 text-lg font-medium md:text-xl">
          Be Part of Our Growth. Build Your Future in Real Estate.
        </p>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-[var(--color-muted)]">
          <p>
            Due to the rapid and continued expansion of South East Asia Property Services (SEAPS)
            across Cambodia and the wider South East Asian region, we welcome expressions of interest
            and CV submissions from motivated individuals seeking to develop their careers within the
            real estate industry.
          </p>
          <p>
            Whether you have an established background in real estate, property management, sales,
            rentals, investment or business development, or simply possess a strong desire to enter
            the industry, we would be delighted to hear from you.
          </p>
          <p>
            At SEAPS, we recognise that talent, ambition, professionalism and a willingness to learn
            are essential to long-term success. We welcome individuals who can bring valuable
            expertise, fresh perspectives and a commitment to delivering exceptional service to our
            growing company.
          </p>
          <p>
            If you are interested in becoming part of our expanding team, we invite you to submit
            your CV, together with a brief introduction outlining your experience, skills, areas of
            expertise and career aspirations.
          </p>
          <p>
            Take the next step in your professional journey and explore the opportunities that await
            you with SEAPS.
          </p>
        </div>

        <p className="mt-10 border-l-2 border-[rgba(212,175,55,0.55)] pl-5 text-base font-medium leading-relaxed text-[var(--color-text)] md:text-lg">
          South East Asia Property Services — Building opportunities, developing talent and shaping
          the future of real estate across South East Asia.
        </p>

        <CareersApplyCta />
      </article>
    </Section>
  );
}

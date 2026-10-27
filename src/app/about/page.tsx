import type { Metadata } from "next";
import Link from "next/link";
import { AboutContactCta } from "@/components/about/about-contact-cta";
import { SeapsYoutubePlayer } from "@/components/media/seaps-youtube-player";
import { Section } from "@/components/shared/section";
import { brand } from "@/config/brand";

const AWARDS_VIDEO_ID = "Ii9DyLywO3Q";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "South East Asia Property Services (SEAPS) — professional real estate, property management and investment solutions across South East Asia.",
};

const coreServices = [
  {
    title: "Residential Property",
    body: "Sales and rentals of luxury condominiums, apartments, villas, houses and residential developments.",
  },
  {
    title: "Commercial Real Estate",
    body: "Property solutions for offices, retail premises, commercial buildings and business investment opportunities.",
  },
  {
    title: "Land and Development",
    body: "Assistance with land acquisition, development projects, agricultural holdings and long-term property investment opportunities.",
  },
  {
    title: "Property Management and Investment Consultancy",
    body: "Professional support for property owners and investors, including property portfolio management, investment planning and development consultancy.",
  },
];

export default function AboutUsPage() {
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          About Us
        </p>
        <h1 className="mx-auto mt-3 w-fit max-w-full font-[family-name:var(--font-display)] text-[1.05rem] leading-tight text-[var(--color-accent-soft)] min-[400px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl">
          <span className="block whitespace-nowrap">South East Asia Property Services</span>
          <span className="mt-2 block text-center">(SEAPS)</span>
        </h1>
        <p className="seaps-brand-subtitle mt-4 text-lg font-medium md:text-xl">
          Professional Real Estate, Property Management and Investment Solutions Across South East
          Asia
        </p>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-[var(--color-muted)]">
          <p>
            South East Asia Property Services (SEAPS) is a multi-award-winning real estate, property
            management and investment company focused on delivering professional property solutions
            across South East Asia.
          </p>
          <p>
            With expertise spanning residential and commercial real estate, land holdings, property
            sales and rentals, and development opportunities, SEAPS connects clients and investors
            with opportunities aligned with their individual needs and investment objectives.
          </p>
          <p>
            Our approach combines in-depth market knowledge, professionalism and personalised service
            to help buyers, sellers, landlords, tenants and investors navigate the property market
            with confidence.
          </p>
        </div>

        <h2 className="mt-14 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Our Core Services
        </h2>
        <ul className="mt-6 space-y-6">
          {coreServices.map((item) => (
            <li
              key={item.title}
              className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--color-accent-soft)]">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-[var(--color-muted)]">{item.body}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Experience and Recognition
        </h2>
        <div className="mt-5 space-y-5 text-lg leading-relaxed text-[var(--color-muted)]">
          <p>
            SEAPS has an established presence in the Cambodian real estate sector. In 2018, the
            company was recognised as Real Estate Agency of the Year in the Corporate Category (8–15
            Employees) at the inaugural Cambodia Real Estate Awards.
          </p>
          <p>
            This recognition reflects SEAPS&apos;s commitment to professionalism and service within the
            property industry.
          </p>
        </div>

        <h2 className="mt-14 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Awards and Recognition
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted)]">
          Watch the video highlighting the Cambodia Real Estate Awards:
        </p>

        <div className="mt-8 max-w-4xl">
          <SeapsYoutubePlayer
            videoId={AWARDS_VIDEO_ID}
            title="Cambodia Real Estate Awards — SEAPS recognition"
          />
        </div>
        <p className="mt-5">
          <Link
            href="https://youtu.be/Ii9DyLywO3Q"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--color-accent-soft)] underline-offset-4 hover:underline"
          >
            View the Cambodia Real Estate Awards video on YouTube
          </Link>
        </p>

        <AboutContactCta />

        <p className="mt-12 text-center text-sm text-[var(--color-muted)]">
          {brand.fullName} · Cambodia · since {brand.foundedYear}
        </p>
      </article>
    </Section>
  );
}

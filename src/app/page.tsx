import { HeroMainLayout } from "@/components/home/hero-main-layout";
import { HeroPromoButtons } from "@/components/home/hero-promo-buttons";
import { HeroSocialLinks } from "@/components/home/hero-social-links";
import { MainSearch } from "@/components/search/main-search";
import { BackgroundVideo } from "@/components/shared/background-video";
import { Section } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { brand } from "@/config/brand";

export default async function HomePage() {
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
        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-14 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14 lg:pb-16">
          <HeroMainLayout
            className="reveal"
            copy={
              <>
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
              </>
            }
            aside={
              <>
                <HeroPromoButtons />
                <MainSearch stretch className="min-h-0" />
              </>
            }
          />
          <HeroSocialLinks className="reveal mt-10 sm:mt-12" />
        </div>
      </section>

      <Section className="pb-24">
        <div className="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] md:max-w-2xl md:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            Request a Personally Tailored Shortlist or Property Management Plan
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            SEAPS Agents/Representatives pride themselves on providing individual clients with a
            professional, personal and individualised experience.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Please complete the contact form, detailing as much information as possible (relevant to
            your circumstances and objectives), and our dedicated Management Team will appoint the
            most suitable Agent/Representative to assist you with your needs.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-[var(--color-muted)]">
            <li>· City and district preferences</li>
            <li>· Budget and deal type (buy / rent / short stay)</li>
            <li>· Must-have amenities and timeline</li>
          </ul>
          <ButtonLink href="/contact" variant="primary" className="mt-6 w-full min-h-11">
            Contact SEAPS - Personalise Your Experience
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}

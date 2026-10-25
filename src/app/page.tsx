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
      <section className="relative z-0 min-h-[min(82vh,760px)] overflow-hidden">
        <BackgroundVideo
          eager
          src="/videos/hero-banner.mp4"
          mobileSrc="/videos/hero-banner-mobile.mp4"
          poster="/videos/hero-banner.jpg"
          overlayClassName="bg-[linear-gradient(105deg,rgba(7,17,31,0.9)_0%,rgba(11,28,51,0.7)_48%,rgba(11,28,51,0.4)_100%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 pt-9 pb-12 sm:px-6 sm:pt-11 lg:px-8 lg:pt-12 lg:pb-14">
          <HeroMainLayout
            className="reveal"
            copyLead={
              <div className="notranslate w-full max-w-2xl">
                <div className="flex w-full flex-col items-start gap-2 sm:gap-2.5">
                  <SeapsLogo
                    size="hero"
                    className="h-[3.875rem] w-[6.125rem] sm:h-[4.25rem] sm:w-[6.75rem] md:h-[4.625rem] md:w-[7.35rem]"
                  />
                  <p className="seaps-brand-subtitle w-full max-w-2xl text-left text-[0.6875rem] leading-snug uppercase tracking-[0.12em] sm:text-[0.734375rem]">
                    {brand.fullName}
                  </p>
                </div>
                <h1 className="notranslate mt-5 max-w-2xl text-left text-xl font-medium leading-snug sm:mt-6 md:text-[1.375rem] lg:leading-[1.35]">
                  <span className="seaps-gold-text block">
                    South East Asia Property Services (SEAPS)
                  </span>
                  <span className="mt-2.5 block text-white/92">
                    is a multi-Award-Winning Real Estate, Property Management and Investment Company,
                    based in South East Asia.
                  </span>
                </h1>
              </div>
            }
            copy={
              <p className="max-w-2xl text-left text-justify hyphens-auto text-base leading-relaxed text-white/95 md:text-[1.0625rem] lg:mt-0.5">
                SEAPS converts market insight into clear individualised strategies by providing Buyers,
                Sellers and Investors with comprehensive property solutions spanning every major sector
                of the market, including Land, Residential and Commercial Properties, Property
                Management, Sales, Rentals, Investment Holdings and Property Development Opportunities.
              </p>
            }
            aside={
              <>
                <HeroPromoButtons />
                <MainSearch className="w-full max-w-none" />
              </>
            }
          />
          <HeroSocialLinks className="reveal mt-10 sm:mt-12" />
        </div>
      </section>

      <Section className="pb-24">
        <div className="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] md:max-w-2xl md:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            <span className="block">Personalise Your Experience with a</span>
            <span className="block">Dedicated SEAPS Specialist</span>
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
          <p className="mt-5 text-sm text-[var(--color-muted)]">Alternatively, you can:</p>
          <ul className="mt-2 space-y-2 text-sm text-[var(--color-muted)]">
            <li>· Contact us via Telephone on: +855  888 714 085, or</li>
            <li>· Reach out to us via our Social Media Platforms</li>
          </ul>
          <ButtonLink href="/contact" variant="primary" className="mt-6 w-full min-h-11">
            Contact SEAPS - Personalise Your Experience
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}

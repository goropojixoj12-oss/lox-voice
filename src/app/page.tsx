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
            copyLead={
              <div className="notranslate flex w-full flex-col items-center text-center">
                <SeapsLogo
                  size="hero"
                  className="h-[4.05rem] w-[6.4rem] sm:h-[4.55rem] sm:w-[7.2rem] md:h-[5.05rem] md:w-[8rem]"
                />
                <p className="seaps-brand-subtitle mt-2 text-[0.65rem] uppercase tracking-[0.14em] sm:mt-2.5 sm:text-[0.7125rem]">
                  {brand.fullName}
                </p>
              </div>
            }
            copy={
              <>
                <h1 className="seaps-gold-text notranslate max-w-2xl text-xl font-medium leading-snug md:text-2xl lg:mt-1">
                  <span className="block">South East Asia Property Services (SEAPS)</span>
                  <span className="block">
                    is a multi-Award-Winning Real Estate, Property Management and Investment Company,
                    based in South East Asia.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-base text-white md:text-lg">
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

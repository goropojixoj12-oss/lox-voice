import { HeroMainLayout } from "@/components/home/hero-main-layout";
import { HeroPromoButtons } from "@/components/home/hero-promo-buttons";
import { HeroSocialLinks } from "@/components/home/hero-social-links";
import { MainSearch } from "@/components/search/main-search";
import { BackgroundVideo } from "@/components/shared/background-video";
import { Section } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";
import { SeapsLogo } from "@/components/brand/seaps-logo";

export default async function HomePage() {
  return (
    <>
      <section className="relative z-0 min-h-[min(88vh,820px)] overflow-hidden">
        <BackgroundVideo
          eager
          src="/videos/hero-banner.mp4"
          mobileSrc="/videos/hero-banner-mobile.mp4"
          poster="/videos/hero-banner.jpg"
          overlayClassName="bg-[linear-gradient(105deg,rgba(7,17,31,0.9)_0%,rgba(11,28,51,0.7)_48%,rgba(11,28,51,0.4)_100%)]"
        />
        <div className="relative mx-auto flex min-h-[min(88vh,820px)] max-w-7xl flex-col px-4 pt-9 pb-8 sm:px-6 sm:pt-11 sm:pb-10 lg:px-8 lg:pt-12 lg:pb-12">
          <div className="flex-1">
            <HeroMainLayout
              className="reveal"
              copyLead={
                <div className="notranslate mx-auto flex w-full max-w-[36rem] flex-col items-center">
                  <SeapsLogo
                    size="hero"
                    className="h-[5.2rem] w-[8.22rem] sm:h-[5.87rem] sm:w-[9.26rem] md:h-[6.53rem] md:w-[10.28rem]"
                  />
                  <p className="seaps-brand-subtitle mt-2 w-full text-center text-[0.77rem] uppercase tracking-[0.16em] sm:mt-2.5 sm:text-[0.84rem] sm:tracking-[0.17em]">
                    <span className="block">South East Asia Property Services</span>
                    <span className="block">Co. Ltd.</span>
                  </p>
                </div>
              }
              copy={
                <div className="mx-auto w-full max-w-[36rem] text-justify hyphens-none [text-align-last:center]">
                  <h1 className="text-[1.2rem] font-bold leading-snug sm:text-[1.3125rem] md:text-[1.45rem]">
                    <span className="block text-center text-white">
                      South East Asia Property Services (SEAPS)
                    </span>
                    <span className="mt-2 block text-[1.125rem] text-white/92 md:text-[1.2rem]">
                      is a multi-Award-Winning Real Estate, Property Management and Investment
                      Company, based in South East Asia.
                    </span>
                  </h1>
                  <p className="mt-3 text-[1.125rem] text-white md:mt-4 md:text-[1.275rem]">
                    SEAPS converts market insight into clear individualised strategies by providing
                    Buyers, Sellers and Investors with comprehensive property solutions spanning every
                    major sector of the market, including Land, Residential and Commercial Properties,
                    Property Management, Sales, Rentals, Investment Holdings and Property Development
                    Opportunities.
                  </p>
                </div>
              }
              aside={
                <>
                  <HeroPromoButtons />
                  <MainSearch className="w-full max-w-none" />
                </>
              }
            />
          </div>
          <HeroSocialLinks className="reveal mt-auto pt-8 sm:pt-10" />
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

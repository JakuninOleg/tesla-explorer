import Image from "next/image";
import { Roboto } from "next/font/google";
import { BrandLogo } from "@/components/brand-logo";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LandingHeader } from "@/features/marketing/landing-header";
import { LandingCarSection } from "@/features/marketing/landing-car-section";
import { LandingDashboardPreview } from "@/features/marketing/landing-dashboard-preview";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { Link } from "@/i18n/navigation";

const landingFont = Roboto({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap" });

const container = "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-14";
const button = "group inline-flex min-h-14 items-center justify-center gap-4 rounded-lg px-6 py-3 text-sm font-medium transition-colors duration-300 [&_svg]:transition-transform [&_svg]:duration-300 motion-safe:hover:[&_svg]:translate-x-1 motion-safe:focus-visible:[&_svg]:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500";
const heading = "text-[1.8rem]! leading-[1.13]! font-medium tracking-[-0.025em]";

export async function LandingPage({ theme }: { theme: "light" | "dark" }) {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const proofs = [
    { text: t("proofBattery"), icon: "bolt" },
    { text: t("proofTime"), icon: "clock" },
    { text: t("proofRoutes"), icon: "map" },
    { text: t("proofPreview"), icon: "play" },
  ] as const;
  const features = [
    { title: t("feature1Title"), body: t("feature1Body"), icon: "search" },
    { title: t("feature2Title"), body: t("feature2Body"), icon: "bolt" },
    { title: t("feature3Title"), body: t("feature3Body"), icon: "play" },
  ] as const;
  const ideas = [
    { title: t("idea1Title"), tags: t("idea1Tags"), meta: t("idea1Meta"), image: "route-dinner" },
    { title: t("idea2Title"), tags: t("idea2Tags"), meta: t("idea2Meta"), image: "route-austin" },
    { title: t("idea3Title"), tags: t("idea3Tags"), meta: t("idea3Meta"), image: "route-zilker" },
    { title: t("idea4Title"), tags: t("idea4Tags"), meta: t("idea4Meta"), image: "route-bonnell" },
  ];
  return (
    <div data-site-theme={theme} className={landingFont.className + " bg-[#f8f9fa] text-[#10171c] [overflow-wrap:break-word] [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-red-500"}>
      <LandingHeader>
        <div className={container + " flex min-h-20 flex-wrap items-center justify-between gap-x-2 gap-y-2 py-3 sm:gap-x-4"}>
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <BrandLogo locale={locale} className="h-auto w-36 shrink-0 sm:w-44" />
          </Link>
          <nav aria-label={t("mainNavigation")} className="hidden items-center gap-5 text-[15px] font-medium text-white/85 lg:flex xl:gap-7 xl:text-base [&_a]:py-3 [&_a]:transition-colors [&_a]:hover:text-white">
            <a href="#features">{t("navFeatures")}</a>
            <a href="#how">{t("navHow")}</a>
            <a href="#ideas">{t("navRoutes")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher variant="landing" />
            <Link href="/sign-in" className="hidden min-h-11 items-center rounded-lg bg-white px-5 text-xs font-semibold text-[#10171c] transition-colors hover:bg-gray-200 sm:inline-flex">{t("signIn")}</Link>
          </div>
        </div>
      </LandingHeader>
      <main>
        <section className="relative isolate overflow-hidden bg-[#020b10] text-white">
          <Image src="/marketing/redesign/hero-road-v2.png" alt="" fill preload className="object-cover object-[67%_center] lg:object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-linear-to-r from-[#020b10]/95 via-[#020b10]/45 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-[#020b10]/90 via-transparent to-[#020b10]/25" />
          <div className={container + " relative pb-12 pt-36 sm:pb-14 lg:min-h-[715px] lg:pb-14 lg:pt-[138px]"}>
            <div className="max-w-[570px]">
              <p className="mb-3 text-xs font-medium tracking-[0.15em] text-white/65 uppercase">{t("eyebrow")}</p>
              <h1 className="max-w-[550px] text-[clamp(2.5rem,5.4vw,4.4rem)]! leading-[0.99]! font-medium tracking-[-0.025em] whitespace-pre-line motion-safe:animate-[landing-hero-rise_700ms_ease-out_both]">{t("headlineLines")}</h1>
              <p className="mt-7 max-w-[535px] text-base leading-[1.45] text-white/90 sm:text-xl">{t("pitch")}</p>
              <Link href="/sign-in" className={button + " mt-7 bg-white text-[#10171c] hover:bg-gray-200"}>{t("cta")}<LandingIcon name="arrow" /></Link>
            </div>
            <ul className="mt-10 grid max-w-[790px] grid-cols-2 gap-x-7 gap-y-6 sm:mt-12 sm:grid-cols-4">
              {proofs.map(({ text, icon }) => <li key={icon} className="flex items-start gap-3 text-sm leading-[1.4] text-white/60"><LandingIcon name={icon} className="mt-0.5 size-5 shrink-0 text-white/85" /><span>{text}</span></li>)}
            </ul>
          </div>
        </section>
        <section id="how" className={container + " scroll-mt-[calc(8rem+env(safe-area-inset-top))] py-10 sm:py-12"}>
          <div className="grid items-center gap-8 lg:grid-cols-[0.75fr_1.8fr] lg:gap-12">
            <div>
              <h2 className={heading + " max-w-[285px] sm:text-[2rem]!"}>{t("howTitle")}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#626a73]">{t("howBody")}</p>
              <Link href="/sign-in" className={button + " mt-6 border border-[#d8dde2] bg-white hover:bg-gray-100"}>{t("howTry")}<LandingIcon name="arrow" /></Link>
            </div>
            <LandingDashboardPreview />
          </div>
        </section>
        <section id="features" className="relative isolate scroll-mt-[calc(8rem+env(safe-area-inset-top))] overflow-hidden bg-[#030d12] text-white">
          <div className="absolute inset-y-0 left-0 w-full opacity-35 sm:w-1/2 sm:opacity-65">
            <Image src="/marketing/redesign/feature-cabin.jpg" alt="" fill className="object-cover object-left" sizes="(min-width: 640px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent to-[#030d12]" />
          </div>
          <div className={container + " relative py-12 sm:py-14"}>
            <div className="sm:ml-[30%]">
              <p className="mb-3 text-xs tracking-[0.12em] text-white/60">{t("featuresEyebrow")}</p>
              <h2 className={heading + " max-w-[530px] whitespace-pre-line sm:text-[2.4rem]!"}>{t("featuresTitle")}</h2>
            </div>
            <p className="absolute top-14 right-14 hidden w-44 rotate-[-9deg] whitespace-pre-line text-center font-[family-name:var(--font-script)] text-[30px] leading-[1.05] text-white/55 lg:block">{t("featuresScript")}</p>
            <div className="mt-8 grid gap-5 md:grid-cols-3 lg:ml-[8%] lg:gap-8">
              {features.map((item, index) => <article key={item.icon} className="rounded-2xl border border-white/15 bg-[#08151c]/75 p-6 backdrop-blur-sm lg:min-h-[244px]">
                <div className="flex items-center justify-between"><LandingIcon name={item.icon} className="size-6 text-white/90" /><span className="text-sm tabular-nums text-white/30">0{index + 1}</span></div>
                <h3 className="mt-6 max-w-[265px] text-[22px] leading-[1.3] font-medium tracking-[-0.015em]">{item.title}</h3>
                <p className="mt-4 text-base leading-[1.4] text-white/60">{item.body}</p>
              </article>)}
            </div>
          </div>
        </section>
        <section id="ideas" className={container + " scroll-mt-[calc(8rem+env(safe-area-inset-top))] py-10 sm:py-9"}>
          <p className="mb-3 text-xs tracking-[0.1em] text-[#626a73] uppercase">{t("navRoutes")}</p>
          <h2 className={heading + " max-w-[340px] sm:text-[2rem]!"}>{t("ideasTitle")}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ideas.map((idea) => <article key={idea.image} className="overflow-hidden rounded-lg border border-[#e3e6e9] bg-white shadow-sm">
              <div className="relative aspect-[1.2]">
                <Image src={"/marketing/redesign/" + idea.image + ".jpg"} alt="" fill className="object-cover" sizes="(min-width: 1280px) 280px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw" />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">{idea.tags.split(" · ").map(tag => <span key={tag} className="rounded-md bg-[#101b22]/85 px-2 py-1 text-[11px] text-white">{tag}</span>)}</div>
              </div>
              <div className="p-4"><h3 className="text-sm leading-snug font-semibold">{idea.title}</h3><p className="mt-2 text-xs text-[#626a73]">{idea.meta}</p></div>
            </article>)}
          </div>
        </section>
        <LandingCarSection />
        <section id="final" className="relative isolate overflow-hidden bg-[#051017] text-white">
          <Image src="/marketing/redesign/cta-sunset.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-linear-to-r from-[#020b10]/90 via-[#020b10]/40 to-[#020b10]/20" />
          <div className={container + " relative flex min-h-[380px] items-center py-14 sm:min-h-[420px]"}>
            <div className="max-w-[470px]">
              <h2 className={heading + " sm:text-[2.9rem]!"}>{t("finalTitle")}</h2>
              <p className="mt-5 text-lg leading-[1.4] text-white/90">{t("finalBody")}</p>
              <Link href="/sign-in" className={button + " mt-7 bg-white text-[#10171c] hover:bg-gray-200"}>{t("cta")}<LandingIcon name="arrow" /></Link>
            </div>
            <p className="ml-auto hidden max-w-[310px] rotate-[-6deg] pl-8 text-center font-[family-name:var(--font-script)] text-3xl text-white/75 lg:block">{t("finalScript")}</p>
          </div>
        </section>
      </main>
      <footer className="bg-[#020b10] text-white">
        <div className={container + " py-10"}>
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center"><BrandLogo locale={locale} className="h-auto w-56" /></Link>
            <nav aria-label={t("footerNavigation")} className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/80 sm:ml-auto sm:justify-end">
              <a href="#features" className="inline-flex min-h-11 items-center">{t("navFeatures")}</a>
              <a href="#ideas" className="inline-flex min-h-11 items-center">{t("navRoutes")}</a>
            </nav>
          </div>
          <div className="mt-7 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/60 sm:flex-row sm:justify-between">
            <div><p>{t("footerCopy")} · {t("disclaimer")}</p><a href="https://jakuninoleg.dev" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center underline decoration-white/25 underline-offset-4 transition-colors hover:text-white">{t("footerCredit")}</a></div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end"><span>{t("footerPrivacy")}</span><span>{t("footerTerms")}</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

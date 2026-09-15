import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CabinetChatPreview,
  PlaceStopPreview,
  RouteCinemaPreview,
} from "@/features/marketing/landing-product-previews";
import { LandingReveal } from "@/features/marketing/landing-reveal";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";

function HeroStack() {
  return (
    <div className="relative mx-auto min-h-[30rem] w-full max-w-xl lg:min-h-[34rem]">
      <div className="landing-float-a absolute left-0 top-0 z-[1] w-[70%] max-w-sm">
        <CabinetChatPreview />
      </div>
      <div className="landing-float-b absolute right-0 top-[26%] z-[3] w-[92%] max-w-lg">
        <RouteCinemaPreview />
      </div>
      <div className="landing-float-c absolute bottom-0 left-[6%] z-[2] w-[58%] max-w-[17rem]">
        <PlaceStopPreview />
      </div>
    </div>
  );
}

export async function LandingPage({
  theme,
}: {
  theme: "light" | "dark";
}) {
  const t = await getTranslations("Home");
  const tAuth = await getTranslations("Auth");

  const steps = [
    { title: t("step1Title"), body: t("step1Body"), n: "01", preview: "chat" as const },
    { title: t("step2Title"), body: t("step2Body"), n: "02", preview: "map" as const },
    { title: t("step3Title"), body: t("step3Body"), n: "03", preview: "place" as const },
  ];

  const benefits = [
    { title: t("benefit1Title"), body: t("benefit1Body") },
    { title: t("benefit2Title"), body: t("benefit2Body") },
    { title: t("benefit3Title"), body: t("benefit3Body") },
  ] as const;

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#f4f4f4] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-background">
      <header className="relative z-20 flex items-center justify-between gap-3 px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={brand.markSrc}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-sm"
            priority
          />
          <span className="text-[0.7rem] font-semibold tracking-[0.28em] text-foreground uppercase">
            {t("brand")}
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <ThemeToggle currentTheme={theme} />
          <PwaInstallButton />
          <Link
            href="/sign-in"
            className="rounded-sm border border-border px-4 py-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {tAuth("signIn")}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 pb-16 pt-6 md:px-10 md:pb-24 md:pt-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_50%),radial-gradient(ellipse_at_100%_20%,color-mix(in_srgb,var(--foreground)_6%,transparent),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_10%_0%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
            <div className="flex flex-col gap-6 lg:max-w-xl">
              <div className="landing-hero-rise">
                <p className="text-sm font-semibold tracking-[0.28em] text-foreground uppercase">
                  {t("brand")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
              </div>
              <h1 className="landing-hero-rise landing-hero-rise-delay text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:leading-[1.08]">
                {t("headline")}
              </h1>
              <p className="landing-hero-rise landing-hero-rise-delay-2 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                {t("pitch")}
              </p>
              <div className="landing-hero-rise landing-hero-rise-delay-2 rounded-sm border border-border bg-white p-4 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.35)] dark:bg-muted/40 dark:shadow-none">
                <p className="text-sm text-muted-foreground">{t("heroPromptLead")}</p>
                <p className="mt-2 rounded-sm bg-[#ececec] px-3 py-2.5 text-sm font-medium text-foreground dark:bg-muted">
                  {t("heroPromptExample")}
                </p>
              </div>
              <div className="landing-hero-rise landing-hero-rise-delay-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex h-12 min-h-11 items-center justify-center rounded-sm bg-accent px-7 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
                >
                  {t("cta")}
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-12 items-center justify-center rounded-sm border border-foreground/25 bg-white px-5 text-sm font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-foreground/50 dark:border-border dark:bg-background dark:text-muted-foreground dark:hover:border-foreground/40 dark:hover:text-foreground"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
              <p className="landing-hero-rise landing-hero-rise-delay-2 text-sm text-muted-foreground">
                {t("proof")}
              </p>
            </div>
            <div className="landing-hero-rise landing-hero-rise-delay">
              <HeroStack />
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16 md:gap-24 md:px-10 md:py-24">
          <LandingReveal>
            <section>
              <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
                {t("howTitle")}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {t("howIntro")}
              </h2>
              <div className="mt-12 flex flex-col gap-10">
                {steps.map((step) => (
                  <div
                    key={step.n}
                    className="grid items-center gap-8 rounded-sm border border-border bg-white p-5 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.22)] dark:bg-muted/20 dark:shadow-none md:grid-cols-2 md:gap-10 md:p-8"
                  >
                    <div>
                      <span className="font-mono text-sm tracking-[0.16em] text-accent">
                        {step.n}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                    <div>
                      {step.preview === "chat" ? (
                        <CabinetChatPreview />
                      ) : step.preview === "map" ? (
                        <RouteCinemaPreview />
                      ) : (
                        <PlaceStopPreview />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </LandingReveal>

          <LandingReveal delayMs={60}>
            <section>
              <h2 className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
                {t("benefitsTitle")}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {benefits.map((item) => (
                  <article
                    key={item.title}
                    className="flex flex-col gap-3 rounded-sm border border-border bg-white p-5 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.22)] dark:bg-muted/25 dark:shadow-none"
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </LandingReveal>

          <LandingReveal delayMs={80}>
            <section className="rounded-sm border border-border bg-white px-6 py-12 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.22)] dark:bg-muted/20 dark:shadow-none md:px-10 md:py-14">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {t("finalTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {t("finalPitch")}
              </p>
              <Link
                href="/sign-in"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-sm bg-accent px-7 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
              >
                {t("cta")}
              </Link>
            </section>
          </LandingReveal>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-5 md:px-10">
        <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          {t("disclaimer")}
        </p>
      </footer>
    </div>
  );
}

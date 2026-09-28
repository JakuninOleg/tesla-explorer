import type { Metadata } from "next";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { BrandLogo } from "@/components/brand-logo";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { Link } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";

const signInFont = Roboto({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("signInTitle") };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();

  if (session?.user) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("Auth");
  const tHome = await getTranslations("Home");

  return (
    <div className={signInFont.className + " relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-[#071016] text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"}>
      <div className="absolute inset-0 -z-10 lg:right-[44%]">
        <Image src="/marketing/redesign/hero-road-v2.png" alt="" fill preload sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover object-[65%_center]" />
        <div className="absolute inset-0 bg-linear-to-b from-[#020b10]/60 via-[#020b10]/40 to-[#020b10]/95" />
        <div className="absolute inset-0 bg-[#071016]/45 lg:bg-linear-to-r lg:from-transparent lg:to-[#071016]/30" />
      </div>
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-10 lg:px-14">
        <Link href="/" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
          <BrandLogo locale={locale} className="h-auto w-36 sm:w-44" />
        </Link>
        <LocaleSwitcher variant="landing" />
      </header>
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-9 px-5 py-8 sm:px-10 sm:py-12 lg:grid-cols-[56fr_44fr] lg:gap-0 lg:px-14 lg:py-16">
        <section className="max-w-[550px] lg:pr-12">
          <p className="text-[11px] font-medium tracking-[0.16em] text-white/65 uppercase">{tHome("eyebrow")}</p>
          <h1 className="mt-4 text-[clamp(2rem,4.2vw,3.8rem)]! leading-[1.06]! font-medium tracking-[-0.03em] whitespace-pre-line">{t("welcomeHeadline")}</h1>
          <p className="mt-5 max-w-[400px] text-base leading-relaxed text-white/70 sm:text-lg">{t("welcomeBody")}</p>
          <div className="mt-10 hidden items-center gap-3 text-sm text-white/65 lg:flex"><LandingIcon name="map" className="size-5" />{t("welcomeNote")}</div>
        </section>
        <section aria-labelledby="sign-in-title" className="w-full max-w-[440px] justify-self-center rounded-2xl border border-white/10 bg-[#0b171f]/95 p-6 shadow-[0_24px_80px_-32px_#000] backdrop-blur-xl sm:p-10 lg:ml-8">
          <span aria-hidden="true" className="mb-7 block h-0.5 w-9 rounded-full bg-[#e31937]" />
          <h2 id="sign-in-title" className="text-[1.8rem]! leading-tight! font-medium tracking-tight">{t("welcomeTitle")}</h2>
          <p className="mt-3 text-base leading-relaxed text-white/60">{t("welcomeIntro")}</p>
          <div className="mt-8">
            <GoogleSignInButton className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-[#10171c] transition-colors duration-200 hover:bg-[#e8edf0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 [&_svg]:size-5 [&_svg]:shrink-0" />
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-white/50">{t("passwordHint")}</p>
          <div className="mt-8 border-t border-white/10 pt-6">
            <Link href="/" className="group inline-flex min-h-11 items-center gap-3 rounded text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
              <LandingIcon name="arrow" className="size-4 rotate-180 transition-transform duration-300 motion-safe:group-hover:-translate-x-1" />{t("backToHome")}
            </Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-[1440px] flex-wrap justify-between gap-3 px-5 pb-6 text-xs leading-relaxed text-white/45 sm:px-10 lg:px-14">
        <p>{tHome("footerCopy")}</p>
        <p>{tHome("disclaimer")}</p>
      </footer>
    </div>
  );
}

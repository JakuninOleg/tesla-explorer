import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "@/features/profile/onboarding-form";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getServerTheme } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage() {
  const t = await getTranslations("Onboarding");
  const tHome = await getTranslations("Home");
  const theme = await getServerTheme();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-5 md:px-10">
        <Link
          href="/"
          className="text-[0.7rem] font-semibold tracking-[0.28em] text-foreground uppercase"
        >
          {tHome("brand")}
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle currentTheme={theme} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12 md:px-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("intro")}</p>
        <OnboardingForm />
        <Link
          href="/"
          className="mt-8 inline-flex h-12 w-fit items-center justify-center rounded-sm border border-border px-6 text-sm font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-foreground/40"
        >
          {t("back")}
        </Link>
      </main>
    </div>
  );
}

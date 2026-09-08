import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { Link } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { getServerTheme } from "@/lib/theme";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";

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

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16 md:px-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("signInTitle")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("signInIntro")}
        </p>
        <div className="mt-10">
          <GoogleSignInButton />
        </div>
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

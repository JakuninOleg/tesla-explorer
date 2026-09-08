import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { getServerTheme } from "@/lib/theme";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const t = await getTranslations("Home");
  const tAuth = await getTranslations("Auth");
  const theme = await getServerTheme();
  const session = await auth();

  if (session?.user) {
    const profile = await getProfileForCurrentUser();
    redirect({ href: profile ? "/dashboard" : "/onboarding", locale });
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:64px_64px]"
      />

      <header className="relative z-10 flex items-center justify-between gap-3 px-6 py-5 md:px-10">
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

      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-20 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.05]">
              {t("brand")}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("tagline")} {t("pitch")}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className="inline-flex h-12 min-h-11 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
              >
                {t("cta")}
              </Link>
            </div>
          </div>

          <div className="relative w-full max-w-sm shrink-0 self-center md:self-auto">
            <div className="overflow-hidden rounded-sm border border-border bg-muted/80">
              <Image
                src={brand.markSrc}
                alt=""
                width={512}
                height={512}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-4 md:px-10">
        <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          {t("disclaimer")}
        </p>
      </footer>
    </div>
  );
}

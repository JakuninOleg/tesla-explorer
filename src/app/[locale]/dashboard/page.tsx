import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { PlanRouteForm } from "@/features/routes/plan-route-form";
import { listRoutesForCurrentUser } from "@/features/routes/route-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { getServerTheme } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();

  if (!session?.user) {
    return redirect({ href: "/sign-in", locale });
  }

  const profile = await getProfileForCurrentUser();
  if (!profile) {
    return redirect({ href: "/onboarding", locale });
  }

  const [t, tHome, tAuth, theme, routeList] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Home"),
    getTranslations("Auth"),
    getServerTheme(),
    listRoutesForCurrentUser(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-5 md:px-10">
        <Link
          href="/dashboard"
          className="text-[0.7rem] font-semibold tracking-[0.28em] text-foreground uppercase"
        >
          {tHome("brand")}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <ThemeToggle currentTheme={theme} />
          <Link
            href="/onboarding"
            className="rounded-sm border border-border px-4 py-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {tAuth("profile")}
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-12 md:px-10">
        <section>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {profile.homePlace} · {profile.teslaModel}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
          <div className="mt-8">
            <PlanRouteForm defaultBatteryPercent={profile.batteryPercent} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t("pastRoutes")}
          </h2>
          {routeList.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("emptyRoutes")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {routeList.map((route) => (
                <li key={route.id}>
                  <Link
                    href={`/routes/${route.id}`}
                    className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {route.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t("hoursShort", { hours: route.availableHours })} ·{" "}
                        {route.createdAt.toLocaleDateString(locale)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                      {route.rating != null
                        ? t("rated", { rating: route.rating })
                        : t("unrated")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { PlanChat } from "@/features/routes/plan-chat";
import { listRoutesForCurrentUser } from "@/features/routes/route-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { getServerTheme } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("title") };
}

function shortenAddress(address: string): string {
  const part = address.split(",")[0]?.trim();
  return part && part.length > 0 ? part : address;
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
  if (!profile || profile.workAddress.trim().length < 5) {
    return redirect({ href: "/onboarding", locale });
  }

  const [t, tHome, tAuth, theme, routeList] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Home"),
    getTranslations("Auth"),
    getServerTheme(),
    listRoutesForCurrentUser(),
  ]);

  const proposed = routeList.filter((route) => route.status === "proposed");
  const approved = routeList.filter((route) => route.status === "approved");
  const displayName =
    session.user.name?.split(" ")[0] ?? session.user.name ?? t("driver");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-5 md:px-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-[0.28em] text-foreground uppercase"
        >
          {tHome("brand")}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <ThemeToggle currentTheme={theme} />
          <Link
            href="/onboarding"
            className="rounded-sm border border-border px-4 py-2 text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {tAuth("profile")}
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12 md:px-10">
        <section className="flex items-start gap-5">
          <Image
            src={brand.markSrc}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] shrink-0 rounded-sm border border-border bg-muted"
          />
          <div className="min-w-0">
            <p className="text-sm tracking-[0.18em] text-muted-foreground uppercase">
              {profile.teslaModel}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
              {t("greeting", { name: displayName })}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              {t("intro")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("anchors", {
                home: shortenAddress(profile.homeAddress),
                work: shortenAddress(profile.workAddress),
              })}
            </p>
            <Link
              href="/onboarding"
              className="mt-3 inline-flex text-sm font-medium tracking-[0.08em] text-accent underline-offset-4 hover:underline"
            >
              {t("editAnchors")}
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t("newTrip")}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{t("assistantCue")}</p>
          <div className="mt-6">
            <PlanChat
              profile={profile}
              displayName={displayName}
              homeLabel={shortenAddress(profile.homeAddress)}
              workLabel={shortenAddress(profile.workAddress)}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t("proposedRoutes")}
          </h2>
          {proposed.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">
              {t("emptyProposed")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {proposed.map((route) => (
                <li key={route.id}>
                  <Link
                    href={`/routes/${route.id}`}
                    className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-foreground">
                        {route.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t("hoursShort", { hours: route.availableHours })} ·{" "}
                        {route.createdAt.toLocaleDateString(locale)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tracking-[0.12em] text-muted-foreground uppercase">
                      {t("statusProposed")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t("savedRoutes")}
          </h2>
          {approved.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">{t("emptySaved")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {approved.map((route) => (
                <li key={route.id}>
                  <Link
                    href={`/routes/${route.id}`}
                    className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-foreground">
                        {route.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t("hoursShort", { hours: route.availableHours })} ·{" "}
                        {route.createdAt.toLocaleDateString(locale)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tracking-[0.12em] text-muted-foreground uppercase">
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

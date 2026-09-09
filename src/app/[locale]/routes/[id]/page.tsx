import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { RouteMapSection } from "@/features/map/route-map-section";
import { buildPlaceContextLinks } from "@/features/places/place-links";
import { RateRouteForm } from "@/features/routes/rate-route-form";
import { RouteDecisionPanel } from "@/features/routes/route-decision-panel";
import { getRouteForCurrentUser } from "@/features/routes/route-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { getServerTheme } from "@/lib/theme";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const route = await getRouteForCurrentUser(id);
  return { title: route?.title ?? "Route" };
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();

  if (!session?.user) {
    return redirect({ href: "/sign-in", locale });
  }

  const detail = await getRouteForCurrentUser(id);
  if (!detail) {
    return redirect({ href: "/dashboard", locale });
  }

  const [t, tHome, theme] = await Promise.all([
    getTranslations("RouteDetail"),
    getTranslations("Home"),
    getServerTheme(),
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
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle currentTheme={theme} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12 md:px-10">
        <section>
          <Link
            href="/dashboard"
            className="text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            {t("back")}
          </Link>
          <p className="mt-4 text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {t(`status.${detail.status}`)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {detail.title}
          </h1>
          {detail.summary ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {detail.summary}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            {t("meta", {
              hours: detail.availableHours,
              battery: detail.batteryPercent,
            })}
          </p>
          {detail.rangeBudgetMiles != null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("rangeBudget", { miles: detail.rangeBudgetMiles })}
            </p>
          ) : null}
          {detail.rangeWarning ? (
            <p className="mt-2 text-sm text-danger">{detail.rangeWarning}</p>
          ) : null}
          <p className="mt-4 max-w-2xl text-sm text-foreground/80">
            <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
              {t("request")}
            </span>
            <span className="mt-1 block">{detail.requestPrompt}</span>
          </p>
        </section>

        <RouteMapSection stops={detail.stops} status={detail.status} />

        <section>
          <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {t("stops")}
          </h2>
          <ol className="mt-4 space-y-6">
            {detail.stops.map((stop, index) => {
              const place = buildPlaceContextLinks(stop);
              return (
                <li key={`${stop.name}-${index}`} className="border-l border-border pl-4">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {stop.name}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    {stop.role} · {stop.kind} ·{" "}
                    {t("minutes", { count: stop.approxMinutes })}
                    {stop.approxDriveMiles != null
                      ? ` · ${t("miles", { count: stop.approxDriveMiles })}`
                      : null}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stop.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-[0.12em] text-accent uppercase transition-opacity hover:opacity-80"
                    >
                      {t("placeMaps")}
                    </a>
                    <a
                      href={place.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-[0.12em] text-accent uppercase transition-opacity hover:opacity-80"
                    >
                      {t("placeYoutube")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {detail.status === "proposed" ? (
          <section>
            <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {t("decision")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("decisionIntro")}</p>
            <div className="mt-6">
              <RouteDecisionPanel
                routeId={detail.id}
                requestPrompt={detail.requestPrompt}
                availableHours={detail.availableHours}
                batteryPercent={detail.batteryPercent}
                startAnchor={detail.startAnchor}
                startOtherText={detail.startOtherText}
                startOtherLat={detail.startOtherLat}
                startOtherLng={detail.startOtherLng}
              />
            </div>
          </section>
        ) : null}

        {detail.status === "approved" ? (
          <section>
            <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {t("feedback")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("feedbackIntro")}</p>
            <div className="mt-6">
              <RateRouteForm
                routeId={detail.id}
                initialRating={detail.rating}
                initialImpressionNotes={detail.impressionNotes}
                initialPreferenceNotes={detail.preferenceNotes}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

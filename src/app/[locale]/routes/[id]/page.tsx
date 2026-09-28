import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppWorkspace } from "@/components/app-workspace";
import { RouteMapSection } from "@/features/map/route-map-section";
import { RateRouteForm } from "@/features/routes/rate-route-form";
import { RouteDecisionPanel } from "@/features/routes/route-decision-panel";
import { getRouteForCurrentUser } from "@/features/routes/route-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const route = await getRouteForCurrentUser(id);
  return { title: route?.title ?? "Route" };
}

export default async function RouteDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const detail = await getRouteForCurrentUser(id);
  if (!detail) return redirect({ href: "/dashboard", locale });
  const t = await getTranslations("RouteDetail");

  return <AppWorkspace active="routes" theme="light" userName={session.user.name?.split(" ")[0] ?? ""}>
    <main className="mx-auto w-full max-w-[96rem] space-y-5 px-4 py-5 sm:px-6 lg:px-7">
      <nav aria-label={t("breadcrumb")} className="flex min-w-0 items-center gap-3 text-xs text-black/50"><Link href="/dashboard#routes" className="shrink-0 hover:text-black">{t("myRoutes")}</Link><span aria-hidden>›</span><span className="truncate text-black/80">{detail.title}</span></nav>
      <section className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-[clamp(1.5rem,2.2vw,2rem)]! leading-tight! font-semibold tracking-[-0.025em]">{detail.title}</h1><span className={`rounded-full border px-3 py-1 text-xs font-medium ${detail.status === "proposed" ? "border-[#e31937]/20 bg-[#fff3f5] text-[#cf1534]" : "border-black/8 bg-[#f6f7f8] text-black/55"}`}>{t(`status.${detail.status}`)}</span></div>
        {detail.summary ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55">{detail.summary}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-black/60"><span className="rounded-lg bg-[#f6f7f8] px-3 py-2">{t("meta", { hours: detail.availableHours, battery: detail.batteryPercent })}</span>{detail.rangeBudgetMiles != null ? <span className="rounded-lg bg-[#f6f7f8] px-3 py-2">{t("rangeBudget", { miles: detail.rangeBudgetMiles })}</span> : null}</div>
        {detail.rangeWarning ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{detail.rangeWarning}</p> : null}
        {detail.status === "proposed" ? <div className="mt-5"><RouteDecisionPanel routeId={detail.id} requestPrompt={detail.requestPrompt} availableHours={detail.availableHours} batteryPercent={detail.batteryPercent} startAnchor={detail.startAnchor} startOtherText={detail.startOtherText} startOtherLat={detail.startOtherLat} startOtherLng={detail.startOtherLng} /></div> : null}
      </section>
      <RouteMapSection stops={detail.stops} status={detail.status} />
      <details className="rounded-2xl border border-black/8 bg-white px-5 py-4"><summary className="cursor-pointer text-sm font-medium">{t("request")}</summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-black/60">{detail.requestPrompt}</p></details>
      {detail.status === "approved" ? <section className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6"><h2 className="text-xl! font-semibold">{t("feedback")}</h2><div className="mt-5"><RateRouteForm routeId={detail.id} initialRating={detail.rating} initialImpressionNotes={detail.impressionNotes} initialPreferenceNotes={detail.preferenceNotes} /></div></section> : null}
    </main>
  </AppWorkspace>;
}

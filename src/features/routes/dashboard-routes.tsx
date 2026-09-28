"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { filterDashboardRoutes, type RouteFilter } from "./dashboard-data";
import type { RouteListItem } from "./route-actions";

export function DashboardRoutes({ routes }: { routes: RouteListItem[] }) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const [filter, setFilter] = useState<RouteFilter>("all");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#saved" || window.location.hash === "#routes") {
        setFilter(window.location.hash === "#saved" ? "history" : "all");
        setExpanded(false);
      }
    };
    const timer = window.setTimeout(syncHash, 0);
    window.addEventListener("hashchange", syncHash);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", syncHash); };
  }, []);
  const filtered = filterDashboardRoutes(routes, filter);
  const visible = expanded ? filtered : filtered.slice(0, 4);
  return <section id="routes" className="scroll-mt-24 py-2">
    <div id="saved" className="scroll-mt-24" />
    <h2 className="text-xl! font-semibold">{t("recentRoutes")}</h2>
    <div className="my-4 flex flex-wrap gap-2" aria-label={t("routeFilters")}>
      {(["all", "proposed", "history"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setExpanded(false); }} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm transition-colors ${filter === value ? "bg-foreground text-background" : "border border-border bg-background hover:bg-muted"}`}>
        <LandingIcon name={value === "proposed" ? "spark" : value === "history" ? "clock" : "map"} className="size-4 shrink-0" />{t(value === "all" ? "allRoutes" : value === "proposed" ? "proposedRoutes" : "savedRoutes")}<span className="opacity-65">{filterDashboardRoutes(routes, value).length}</span>
      </button>)}
    </div>
    {!visible.length ? <div className="rounded-xl border border-dashed border-border bg-background px-5 py-8 text-sm leading-relaxed text-muted-foreground">{t("emptyRoutes")}</div> : <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map((route) => <article key={route.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="relative flex h-32 items-end justify-between overflow-hidden bg-muted px-4 pb-3"><Image src="/marketing/redesign/cta-sunset.jpg" alt="" fill sizes="(min-width:1536px) 18vw, 45vw" className="object-cover" /><span className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" /><span className="relative flex items-center gap-1.5 text-xs text-white"><LandingIcon name={route.status === "proposed" ? "spark" : "map"} className="size-4" />{t(`routeStatus.${route.status}`)}</span><span className="relative text-[10px] text-white/80">{t("routeArtwork")}</span></div>
        <div className="flex flex-1 flex-col p-4"><Link href={`/routes/${route.id}`} className="text-sm font-semibold leading-snug hover:text-accent">{route.title}</Link>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><LandingIcon name="clock" className="size-3.5" />{t("hoursShort", { hours: route.availableHours })}</p>
          <p className="mt-2 text-xs text-muted-foreground">{new Date(route.createdAt).toLocaleDateString(locale)}</p>
          <Link href={`/routes/${route.id}${route.status === "approved" && route.rating === null ? "#rating" : ""}`} className={`mt-4 flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${route.status === "approved" && route.rating === null ? "bg-accent/10 text-accent hover:bg-accent/20" : "bg-muted hover:bg-black/10"}`}>
            {route.status === "approved" ? <><LandingIcon name="star" className="size-4 shrink-0" />{route.rating === null ? t("unrated") : t("rated", { rating: route.rating })}</> : t("statusProposed")}<LandingIcon name="arrow" className="size-4 shrink-0" />
          </Link>
        </div>
      </article>)}
    </div>}
    {filtered.length > 4 ? <button type="button" className="mt-4 min-h-10 cursor-pointer text-sm font-medium hover:text-accent" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{t(expanded ? "showLess" : "showAll")}</button> : null}
  </section>;
}

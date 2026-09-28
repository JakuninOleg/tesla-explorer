"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { OnboardingInput } from "@/features/profile/onboarding-schema";
import { PlanChat } from "@/features/routes/plan-chat";
import { useTripPlanner } from "@/features/routes/use-trip-planner";
import { SCENARIOS, validTripSettings } from "@/features/routes/dashboard-data";
import { DashboardRoutes } from "@/features/routes/dashboard-routes";
import type { RouteListItem } from "@/features/routes/route-actions";
import { estimateRangeMiles } from "@/features/routes/tesla-range";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { Link } from "@/i18n/navigation";
import { anchorStops } from "./home-map-state";

const RouteMap = dynamic(() => import("./route-map").then((module) => module.RouteMap), { ssr: false, loading: () => <div className="h-[34rem] animate-pulse bg-[#101f2a]" /> });

export function DashboardPlanner({ profile, displayName, homeLabel, workLabel, token, routes }: {
  profile: OnboardingInput; displayName: string; homeLabel: string; workLabel: string; token: string | null; routes: RouteListItem[];
}) {
  const t = useTranslations("Dashboard");
  const planner = useTripPlanner();
  const heroInput = useRef<HTMLInputElement>(null);
  const settings = useRef<HTMLDetailsElement>(null);
  const label = planner.anchor === "home" ? homeLabel : workLabel;
  const lat = planner.anchor === "home" ? profile.homeLat : profile.workLat;
  const lng = planner.anchor === "home" ? profile.homeLng : profile.workLng;
  const stops = useMemo(() => anchorStops(lat, lng, label), [lat, lng, label]);
  const range = validTripSettings(planner.hours, planner.battery) ? estimateRangeMiles({ model: profile.teslaModel, batteryPercent: planner.battery }).grossMiles : null;
  function chooseScenario(id: typeof SCENARIOS[number]["id"]) {
    if (planner.pending) return;
    const scenario = SCENARIOS.find((item) => item.id === id)!;
    planner.setDraft(t(`scenarios.${id}.prompt`)); planner.setHours(scenario.hours);
    heroInput.current?.focus({ preventScroll: true });
    heroInput.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function openSettings() {
    if (settings.current) { settings.current.open = true; settings.current.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }
  return <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_290px] 2xl:grid-cols-[minmax(0,1fr)_320px]" data-testid="dashboard-planner">
    <div className="min-w-0 space-y-5">
      <section aria-label={t("newTrip")} className="relative isolate overflow-hidden rounded-xl bg-[#071016] text-white [&_.mapboxgl-ctrl-group]:flex sm:[&_.mapboxgl-ctrl-group]:block" data-testid="dashboard-map-hero">
        <RouteMap stops={stops} line={null} token={token} missingTokenLabel={t("homeMapUnavailable")} insufficientStopsLabel={t("homeMapMissing")} stationary cinematic followCamera={false} />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#071016]/65 via-[#071016]/10 to-transparent" />
        <div className="absolute inset-x-3 bottom-14 rounded-xl border border-white/15 bg-[#08151d]/90 p-5 shadow-xl backdrop-blur-md sm:top-10 sm:right-auto sm:bottom-auto sm:left-5 sm:w-[min(48%,440px)] sm:p-6" data-testid="dashboard-greeting">
          <h1 className="text-[clamp(1.65rem,2.2vw,2.5rem)]! leading-[1.12]! font-semibold tracking-tight">{t("greeting", { name: displayName })}</h1>
          <p className="mt-2 text-lg leading-snug text-white/90">{t("newTrip")}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{t("intro")}</p>
          <div className="mt-5 flex flex-wrap gap-2">{SCENARIOS.map((scenario) => <button key={scenario.id} disabled={planner.pending} type="button" onClick={() => chooseScenario(scenario.id)} className="min-h-9 cursor-pointer whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 text-xs transition-colors hover:bg-white/20 disabled:opacity-50">{t(`scenarios.${scenario.id}.chip`)}</button>)}</div>
          <form className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-2" onSubmit={(event) => { event.preventDefault(); void planner.send(); }}>
            <LandingIcon name="spark" className="ml-1 size-4 shrink-0" /><label htmlFor="hero-draft" className="sr-only">{t("prompt")}</label>
            <input ref={heroInput} id="hero-draft" data-testid="hero-draft" disabled={planner.pending} value={planner.draft} maxLength={4000} onChange={(event) => planner.setDraft(event.target.value)} placeholder={t("heroPlaceholder")} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
            <button type="submit" disabled={!planner.canSend} aria-label={t("chatSend")} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"><LandingIcon name="send" className="size-4" /></button>
          </form>
          {planner.pending ? <p role="status" className="mt-2 text-xs text-white/80">{t("planning")}</p> : null}
          {planner.draft.trim().length > 0 && planner.draft.trim().length < 8 ? <p className="mt-2 text-xs text-white/80">{t("promptHint")}</p> : null}
          {planner.error ? <p role="alert" className="mt-2 text-sm text-red-200">{planner.error}</p> : null}
        </div>
        <span className="pointer-events-none absolute right-3 bottom-14 hidden rounded-full bg-[#071016]/85 px-3 py-1 text-[10px] text-white/80 sm:block">{t("homeMapHint")}</span>
      </section>
      <section aria-label={t("tripSummary")} className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <button type="button" onClick={openSettings} className="flex cursor-pointer items-center gap-3 rounded-lg text-left hover:bg-muted"><LandingIcon name="car" /><span className="min-w-0 text-sm"><span className="block font-medium">{profile.teslaModel}</span><span className="mt-1 block text-xs text-muted-foreground">{planner.battery || "—"}% · {t("manualLabel")}</span></span></button>
        {(["home", "work"] as const).map((value) => <button key={value} type="button" disabled={planner.pending} aria-pressed={planner.anchor === value} onClick={() => planner.setAnchor(value)} className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50 ${planner.anchor === value ? "border-accent/35 bg-accent/5" : "border-transparent"}`}><LandingIcon name={value} /><span className="min-w-0"><span className="block text-sm font-medium">{t(value === "home" ? "homeMapHome" : "homeMapWork")}</span><span className="mt-1 block break-words text-xs text-muted-foreground">{value === "home" ? homeLabel : workLabel}</span></span></button>)}
      </section>
      <section aria-labelledby="scenario-title" className="py-2">
        <h2 id="scenario-title" className="mb-4 text-xl! font-semibold">{t("popularScenarios")}</h2>
        <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">{SCENARIOS.map((scenario) => <button key={scenario.id} type="button" data-testid={`scenario-${scenario.id}`} disabled={planner.pending} onClick={() => chooseScenario(scenario.id)} className="group relative isolate flex min-h-44 min-w-0 cursor-pointer flex-col justify-end overflow-hidden rounded-xl bg-[#071016] p-4 text-left text-white disabled:opacity-50">
          <Image src={`/marketing/redesign/${scenario.image}`} alt="" fill sizes="(min-width:1536px) 18vw, 40vw" className="-z-20 object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /><span className="absolute inset-0 -z-10 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
          <span className="pr-6 text-sm font-medium leading-snug">{t(`scenarios.${scenario.id}.title`)}</span><span className="mt-2 text-xs text-white/80">{t(`scenarios.${scenario.id}.meta`)}</span><span className="absolute right-3 bottom-8 flex size-7 items-center justify-center rounded-full bg-white/15"><LandingIcon name="arrow" className="size-4" /></span>
        </button>)}</div>
      </section>
      <DashboardRoutes routes={routes} />
    </div>
    <aside className="min-w-0 space-y-4">
      <PlanChat planner={planner} onScenario={chooseScenario} />
      <section className="overflow-hidden rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between gap-2"><h2 className="text-base! font-semibold">{t("yourCar")}</h2><Link href="/onboarding" className="text-xs text-muted-foreground hover:text-accent">{t("edit")}</Link></div>
        <Image src="/marketing/redesign/dashboard-tesla.png" alt={t("carIllustration")} width={1536} height={1024} sizes="320px" className="my-2 h-36 w-full object-contain" />
        <h3 className="text-base font-semibold">{profile.teslaModel}</h3><p className="mt-1 text-sm text-muted-foreground">{planner.battery || "—"}% {range !== null ? `· ≈ ${range} mi` : ""}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("manualBatteryHint")}</p>
      </section>
      <details ref={settings} id="trip-settings" className="scroll-mt-24 rounded-xl border border-border bg-background p-5">
        <summary className="cursor-pointer text-sm font-semibold">{t("tripSettings")}</summary>
        <fieldset disabled={planner.pending} className="mt-4 space-y-4">
          <label className="block text-sm">{t("hours")}<input type="number" min={1} max={16} step={1} value={planner.hours || ""} onChange={(event) => planner.setHours(Number(event.target.value))} className="mt-2 h-11 w-full rounded-lg border border-border bg-muted px-3" /></label>
          <label className="block text-sm">{t("battery")}<input type="number" min={1} max={100} value={planner.battery || ""} onChange={(event) => planner.setBattery(Number(event.target.value))} className="mt-2 h-11 w-full rounded-lg border border-border bg-muted px-3" /></label>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("tripSettingsHint")}</p>
          {!validTripSettings(planner.hours, planner.battery) ? <p role="alert" className="text-xs text-danger">{t("invalidSettings")}</p> : null}
        </fieldset>
      </details>
      <section className="rounded-xl border border-border bg-background p-5"><h2 className="mb-3 text-base! font-semibold">{t("quickActions")}</h2><Link href="/onboarding" className="flex min-h-11 items-center gap-2 text-sm hover:text-accent"><LandingIcon name="home" className="size-4 shrink-0" />{t("editAnchors")}</Link><button type="button" onClick={openSettings} className="flex min-h-11 cursor-pointer items-center gap-2 text-left text-sm hover:text-accent"><LandingIcon name="settings" className="size-4 shrink-0" />{t("tripSettings")}</button></section>
    </aside>
  </div>;
}

"use client";

import { useTranslations } from "next-intl";
import { buildPlaceContextLinks } from "@/features/places/place-links";
import { isAlongRoutePlaceStop } from "@/features/places/place-media-eligibility";
import type { ItineraryStop } from "./itinerary-schema";

export function RouteStops({ stops, selectedIndex, distance, onSelect, onMedia }: {
  stops: ItineraryStop[]; selectedIndex: number; distance: number | null; onSelect: (index: number) => void; onMedia: () => void;
}) {
  const t = useTranslations("RouteDetail");
  const selected = stops[selectedIndex];
  const links = selected ? buildPlaceContextLinks(selected) : null;
  const showMedia = selected && isAlongRoutePlaceStop(selected);
  const illustration = selected?.kind === "food" ? "route-dinner.jpg" : selected?.kind === "scenic" || selected?.kind === "viewpoint" ? "route-bonnell.jpg" : "route-austin.jpg";
  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
    <section className="min-w-0 rounded-xl border border-black/8 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/7 pb-4">
        <h2 className="text-xl! font-semibold tracking-tight">{t("stops")}</h2>
        <div className="flex gap-5 text-sm">
          {distance != null ? <div><strong className="block font-semibold">{distance.toFixed(1)} mi</strong><span className="text-xs text-black/45">{t("roadDistance")}</span></div> : null}
          <div><strong className="block font-semibold">{stops.length}</strong><span className="text-xs text-black/45">{t("stopsCount")}</span></div>
        </div>
      </div>
      <ol className="mt-3">
        {stops.map((stop, index) => <li key={`${index}-${stop.name}`} className="relative">
          {index < stops.length - 1 ? <span aria-hidden className="absolute top-12 bottom-0 left-[17px] border-l border-dashed border-black/20" /> : null}
          <button type="button" onClick={() => onSelect(index)} aria-pressed={selectedIndex === index} data-testid={`route-timeline-${index}`} className="group flex w-full gap-4 rounded-lg py-4 text-left outline-offset-4">
            <span className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${selectedIndex === index ? "bg-[#e31937]" : "bg-[#17232c] group-hover:bg-[#354653]"}`}>{index + 1}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{stop.name}</span><span className="mt-1 block text-xs leading-relaxed text-black/50">{stop.reason}</span>
              <span className="mt-3 flex flex-wrap gap-2 text-xs text-black/50"><span className="rounded bg-[#f5f6f8] px-2 py-1">{t(`kinds.${stop.kind}`)}</span>{stop.approxMinutes > 0 ? <span className="rounded bg-[#f5f6f8] px-2 py-1">{t("stopDuration", {count: stop.approxMinutes})}</span> : null}</span>
            </span>
          </button>
        </li>)}
      </ol>
    </section>
    {selected && links ? <aside className="min-w-0 overflow-hidden rounded-xl border border-black/8 bg-white p-5 lg:sticky lg:top-20" data-testid="route-stop-details">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base! font-semibold">{t("selectedStop", {current: selectedIndex + 1, total: stops.length})}</h2><div className="flex gap-2">
        <button type="button" aria-label={t("previousStop")} disabled={selectedIndex === 0} onClick={() => onSelect(selectedIndex - 1)} className="h-9 w-10 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-25">←</button>
        <button type="button" aria-label={t("nextStop")} disabled={selectedIndex >= stops.length - 1} onClick={() => onSelect(selectedIndex + 1)} className="h-9 w-10 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-25">→</button>
      </div></div>
      {showMedia ? <figure className="relative overflow-hidden rounded-lg bg-[#071016]">
        {/* Category artwork is labelled, never presented as an actual place photo. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/marketing/redesign/${illustration}`} alt="" className="aspect-[16/8] w-full object-cover" />
        <figcaption className="absolute bottom-0 inset-x-0 bg-black/65 px-3 py-1 text-[10px] text-white/80">{t("illustrationHint")}</figcaption>
      </figure> : null}
      <h3 className="mt-4 text-xl font-semibold tracking-tight">{selected.name}</h3>
      <p className="mt-2 text-xs text-black/45">{t(`kinds.${selected.kind}`)}{selected.approxMinutes > 0 ? ` · ${t("stopDuration", {count: selected.approxMinutes})}` : ""}</p>
      <p className="mt-3 text-sm leading-relaxed text-black/60">{selected.reason}</p>
      <div className="mt-5 flex flex-col gap-2">
        <a href={links.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between rounded-lg border border-black/10 px-4 text-sm hover:bg-black/5">{t("placeMaps")}<span aria-hidden>↗</span></a>
        {showMedia ? <button type="button" onClick={onMedia} className="flex min-h-11 items-center justify-between rounded-lg border border-black/10 px-4 text-left text-sm hover:bg-black/5">{t("cinemaWatchPlace")}<span className="text-[#e31937]" aria-hidden>▷</span></button> : null}
      </div>
    </aside> : null}
  </div>;
}

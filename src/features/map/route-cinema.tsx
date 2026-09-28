"use client";

import type { LineString } from "geojson";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cinemaPlaybackDurationMs, playbackProgress, playbackTime, orderedStopProgress } from "./cinema-playback";
import { RouteMap } from "./route-map";
import { lineLengthMiles, type LngLat, type MappedStop } from "./route-geometry";
import { StopMediaOverlay } from "@/features/places/stop-media-overlay";
import { RouteStops } from "@/features/routes/route-stops";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export function RouteCinema({ stops, line, token, itineraryStops }: {
  stops: MappedStop[]; line: LineString | null; token: string | null; itineraryStops: ItineraryStop[];
}) {
  const t = useTranslations("RouteDetail");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [follow, setFollow] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [seekEpoch, setSeekEpoch] = useState(0);
  const progressRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const duration = useMemo(() => cinemaPlaybackDurationMs(line), [line]);
  const coordinates = useMemo(() => (line?.coordinates ?? []) as LngLat[], [line]);
  const distance = useMemo(() => line ? lineLengthMiles(coordinates) : null, [line, coordinates]);
  const canPlay = Boolean(mapReady && token && coordinates.length >= 2);
  const stopProgress = useMemo(() => orderedStopProgress(coordinates, stops), [stops, coordinates]);
  const seek = useCallback((value: number, selected?: number) => {
    const next = Math.max(0, Math.min(1, value));
    progressRef.current = next;
    setProgress(next);
    setSelectedIndex(selected ?? stopProgress.filter((stop) => stop.at <= next + 0.002).at(-1)?.index ?? 0);
    setSeekEpoch((epoch) => epoch + 1);
  }, [stopProgress]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullScreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!playing || !canPlay) return;
    let frame = 0;
    const started = performance.now();
    const from = progressRef.current;
    const tick = (now: number) => {
      const next = playbackProgress(from, now - started, duration, speed);
      progressRef.current = next;
      setProgress(next);
      const passed = stopProgress.filter((stop) => stop.at <= next + 0.002).at(-1);
      if (passed) setSelectedIndex(passed.index);
      if (next >= 1) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, canPlay, duration, speed, seekEpoch, stopProgress]);

  const selectStop = (index: number) => {
    setPlaying(false); setMediaOpen(false); setSelectedIndex(index); setFollow(false); setFocusedIndex(index);
    const point = stopProgress.find((stop) => stop.index === index);
    if (point && line) seek(point.at, index);
  };
  const selected = itineraryStops[selectedIndex];

  return <div className="space-y-4" data-testid="route-cinema">
    <div ref={stageRef} className="relative overflow-hidden rounded-xl border border-black/10 bg-[#071016] text-white [&:fullscreen]:flex [&:fullscreen]:h-svh [&:fullscreen]:w-svw [&:fullscreen]:flex-col [&:fullscreen]:justify-center [&:fullscreen]:rounded-none">
      <RouteMap stops={stops} line={line} token={token} cinematic followCamera={follow} playProgress={progress}
        fullScreen={fullScreen} focusedStopIndex={focusedIndex} onReadyChange={setMapReady} onStopSelect={selectStop}
        missingTokenLabel={t("mapMissingToken")} insufficientStopsLabel={t("mapNoCoordinates")} />
      <div className="absolute top-3 right-16 left-3 flex flex-wrap gap-1 rounded-xl border border-white/15 bg-[#071016]/90 p-1 text-xs shadow-lg sm:right-auto">
        <button type="button" aria-pressed={follow} onClick={() => { setFocusedIndex(null); setFollow(!follow); }} className={`min-h-10 rounded-lg px-3 ${follow ? "bg-[#e31937]" : "hover:bg-white/10"}`} data-testid="route-cinema-follow">{t("cinemaFollow")}</button>
        <button type="button" onClick={() => { setFollow(false); setFocusedIndex(null); }} className="min-h-10 rounded-lg px-3 hover:bg-white/10">{t("cinemaFreeCam")}</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#071016]/95 px-4 py-3 sm:flex-nowrap" data-testid="route-player-controls">
        <button type="button" disabled={!canPlay} data-testid="route-cinema-play" aria-label={playing ? t("cinemaPause") : progress >= 1 ? t("cinemaReplay") : t("cinemaPlay")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#e31937] disabled:opacity-30"
          onClick={() => { if (progressRef.current === 0 || progressRef.current >= 1) setFollow(true); if (progressRef.current >= 1) seek(0); setMediaOpen(false); setFocusedIndex(null); setPlaying(!playing); }}>
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>{playing ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="m7 4 14 8-14 8z" />}</svg>
        </button>
        <span className="text-xs tabular-nums" data-testid="route-playback-time">{playbackTime(progress * duration)}</span>
        <input type="range" min={0} max={1} step={0.001} value={progress} disabled={!canPlay} aria-label={t("cinemaScrub")} data-testid="route-cinema-scrubber"
          className="min-w-20 flex-1 cursor-pointer accent-[#e31937]" onChange={(event) => { setFocusedIndex(null); seek(Number(event.target.value)); }} />
        <span className="text-xs text-white/60 tabular-nums">{playbackTime(duration)}</span>
        <select aria-label={t("cinemaSpeed")} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="h-10 rounded-full border border-white/20 bg-[#111d25] px-3 text-xs">
          {[0.5, 1, 2, 4].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
        </select>
        <button type="button" aria-label={t("fullscreen")} onClick={() => {
          if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
          else void stageRef.current?.requestFullscreen?.().catch(() => {});
        }} className="flex size-10 items-center justify-center rounded-lg border border-white/15 hover:bg-white/10"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5" /></svg></button>
      </div>
      {mediaOpen && selected ? <StopMediaOverlay title={selected.name} description={selected.reason} lat={selected.lat} lng={selected.lng} kind={selected.kind} continueLabel={t("closePreview")} watchPlaceLabel={t("cinemaWatchPlace")} openYoutubeLabel={t("placeYoutube")} onContinue={() => setMediaOpen(false)} /> : null}
    </div>
    <p className="px-1 text-xs text-black/50">{line ? t("previewHint") : t("roadUnavailable")}</p>
    <RouteStops stops={itineraryStops} selectedIndex={selectedIndex} distance={distance} onSelect={selectStop} onMedia={() => { setPlaying(false); setMediaOpen(true); stageRef.current?.scrollIntoView({behavior: "smooth", block: "center"}); }} />
  </div>;
}

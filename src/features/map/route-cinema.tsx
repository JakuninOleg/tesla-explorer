"use client";

import type { LineString } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { cinemaPlaybackMsAtRate } from "@/features/map/cinema-playback";
import { RouteMap } from "@/features/map/route-map";
import {
  progressNearCoordinate,
  type LngLat,
  type MappedStop,
} from "@/features/map/route-geometry";
import { StopMediaOverlay } from "@/features/places/stop-media-overlay";
import { isAlongRoutePlaceStop } from "@/features/places/place-media-eligibility";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

export function RouteCinema({
  stops,
  line,
  token,
  missingTokenLabel,
  insufficientStopsLabel,
  playLabel,
  pauseLabel,
  replayLabel,
  chargePulseLabel,
  continueLabel,
  watchPlaceLabel,
  openYoutubeLabel,
  followLabel,
  freeCamLabel,
  scrubLabel,
  speedLabel,
  cinematic = true,
  autoPlay = false,
  itineraryStops = [],
}: {
  stops: MappedStop[];
  line: LineString | null;
  token: string | null;
  missingTokenLabel: string;
  insufficientStopsLabel: string;
  playLabel: string;
  pauseLabel: string;
  replayLabel: string;
  chargePulseLabel: string;
  continueLabel: string;
  watchPlaceLabel: string;
  openYoutubeLabel: string;
  followLabel: string;
  freeCamLabel: string;
  scrubLabel: string;
  speedLabel: string;
  cinematic?: boolean;
  autoPlay?: boolean;
  itineraryStops?: ItineraryStop[];
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState<number | null>(0);
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);
  const [seenStops, setSeenStops] = useState<Set<number>>(() => new Set());
  const [followCamera, setFollowCamera] = useState(true);
  const [speedRate, setSpeedRate] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const [seekEpoch, setSeekEpoch] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress ?? 0;
  }, [progress]);

  const routeKey = useMemo(
    () => JSON.stringify({ stops, line }),
    [stops, line],
  );
  const canPlay = Boolean(token && line && line.coordinates.length >= 2);
  const playbackMs = useMemo(
    () => cinemaPlaybackMsAtRate(line, speedRate),
    [line, speedRate],
  );

  const mediaStops = useMemo(
    () => stops.filter((stop) => isAlongRoutePlaceStop(stop)),
    [stops],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlaying(false);
      setProgress(0);
      setActiveStopIndex(null);
      setSeenStops(new Set());
      setFollowCamera(true);
      setSpeedRate(1);
      if (autoPlay && canPlay) {
        setPlaying(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [routeKey, autoPlay, canPlay]);

  useEffect(() => {
    if (!playing || activeStopIndex != null) {
      return;
    }

    let frame = 0;
    const started = performance.now();
    const startProgress = progressRef.current;

    const tick = (now: number) => {
      const elapsed = now - started;
      const next = Math.min(1, startProgress + elapsed / playbackMs);
      setProgress(next);

      if (line && mediaStops.length > 0) {
        const coordinates = line.coordinates as LngLat[];
        for (const stop of mediaStops) {
          if (seenStops.has(stop.listIndex)) {
            continue;
          }
          const at = progressNearCoordinate(coordinates, stop.lngLat);
          if (Math.abs(at - next) < 0.018) {
            setPlaying(false);
            setActiveStopIndex(stop.listIndex);
            setSeenStops((prev) => new Set(prev).add(stop.listIndex));
            return;
          }
        }
      }

      if (next >= 1) {
        setPlaying(false);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, activeStopIndex, playbackMs, seekEpoch]);

  const activeStop =
    activeStopIndex == null
      ? null
      : (stops.find((s) => s.listIndex === activeStopIndex) ?? null);
  const activeItinerary =
    activeStopIndex == null ? null : (itineraryStops[activeStopIndex] ?? null);

  const chargeNear = useMemo(() => {
    if (!playing || progress == null || !line) {
      return false;
    }
    const coordinates = line.coordinates as LngLat[];
    return stops.some((stop) => {
      if (stop.kind !== "charge" && stop.role !== "charge") {
        return false;
      }
      const at = progressNearCoordinate(coordinates, stop.lngLat);
      return Math.abs(at - progress) < 0.05;
    });
  }, [playing, progress, line, stops]);

  return (
    <div className="flex flex-col gap-4" data-testid="route-cinema">
      <div className="relative">
        <RouteMap
          stops={stops}
          line={line}
          token={token}
          missingTokenLabel={missingTokenLabel}
          insufficientStopsLabel={insufficientStopsLabel}
          playProgress={progress}
          cinematic={cinematic}
          followCamera={followCamera}
          onStopSelect={(listIndex) => {
            const stop = stops.find((s) => s.listIndex === listIndex);
            if (!stop || !isAlongRoutePlaceStop(stop)) {
              return;
            }
            setPlaying(false);
            setActiveStopIndex(listIndex);
            setSeenStops((prev) => new Set(prev).add(listIndex));
          }}
        />
        {chargeNear ? (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
            <span className="animate-pulse rounded-sm bg-accent px-4 py-2 text-sm font-semibold tracking-[0.16em] text-accent-foreground uppercase shadow-lg">
              {chargePulseLabel}
            </span>
          </div>
        ) : null}
        {activeStop && isAlongRoutePlaceStop(activeStop) ? (
          <StopMediaOverlay
            title={activeStop.name}
            description={activeItinerary?.reason ?? null}
            lat={activeItinerary?.lat ?? activeStop.lngLat[1]}
            lng={activeItinerary?.lng ?? activeStop.lngLat[0]}
            kind={activeItinerary?.kind ?? activeStop.kind}
            continueLabel={continueLabel}
            watchPlaceLabel={watchPlaceLabel}
            openYoutubeLabel={openYoutubeLabel}
            onContinue={() => {
              setActiveStopIndex(null);
              setPlaying(true);
            }}
          />
        ) : null}
      </div>

      {canPlay ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="route-cinema-play"
              className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
              onClick={() => {
                if (activeStopIndex != null) {
                  return;
                }
                if (!playing && progress != null && progress >= 1) {
                  setProgress(0);
                  setSeenStops(new Set());
                }
                if (!playing && (progress == null || progress === 0)) {
                  setProgress(0);
                }
                setPlaying((value) => !value);
              }}
            >
              {playing
                ? pauseLabel
                : progress != null && progress >= 1
                  ? replayLabel
                  : playLabel}
            </button>
            <button
              type="button"
              data-testid="route-cinema-follow"
              className={`inline-flex h-12 items-center justify-center rounded-sm border px-4 text-sm font-semibold tracking-[0.12em] uppercase transition-colors ${
                followCamera
                  ? "border-accent text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setFollowCamera((value) => !value)}
            >
              {followCamera ? followLabel : freeCamLabel}
            </button>
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label={speedLabel}
            >
              {SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  data-testid={`route-cinema-speed-${rate}`}
                  className={`inline-flex h-10 min-w-12 items-center justify-center rounded-sm border px-2 text-sm transition-colors ${
                    speedRate === rate
                      ? "border-accent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setSpeedRate(rate);
                    if (playing) {
                      setSeekEpoch((n) => n + 1);
                    }
                  }}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="sr-only">{scrubLabel}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress ?? 0}
              data-testid="route-cinema-scrubber"
              aria-label={scrubLabel}
              className="h-2 w-full cursor-pointer accent-[var(--accent)]"
              onChange={(event) => {
                const next = Number(event.target.value);
                setProgress(next);
                setSeekEpoch((n) => n + 1);
              }}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

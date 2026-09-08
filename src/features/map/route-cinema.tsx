"use client";

import type { LineString } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { RouteMap } from "@/features/map/route-map";
import {
  progressNearCoordinate,
  type LngLat,
  type MappedStop,
} from "@/features/map/route-geometry";

const PLAYBACK_MS = 14000;

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
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const routeKey = useMemo(
    () => JSON.stringify({ stops, line }),
    [stops, line],
  );
  const canPlay = Boolean(token && line && line.coordinates.length >= 2);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlaying(false);
      setProgress(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [routeKey]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    let frame = 0;
    const started = performance.now();
    const startProgress = progress ?? 0;

    const tick = (now: number) => {
      const elapsed = now - started;
      const next = Math.min(1, startProgress + elapsed / PLAYBACK_MS);
      setProgress(next);
      if (next >= 1) {
        setPlaying(false);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
    // Intentionally omit progress: restart only when play toggles on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const chargeNear = useMemo(() => {
    if (progress == null || !line) {
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
  }, [progress, line, stops]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <RouteMap
          stops={stops}
          line={line}
          token={token}
          missingTokenLabel={missingTokenLabel}
          insufficientStopsLabel={insufficientStopsLabel}
          playProgress={progress}
        />
        {chargeNear ? (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-4">
            <span className="animate-pulse rounded-sm bg-accent px-3 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-accent-foreground uppercase shadow-lg">
              {chargePulseLabel}
            </span>
          </div>
        ) : null}
      </div>

      {canPlay ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-accent px-5 text-xs font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
            onClick={() => {
              if (!playing && progress != null && progress >= 1) {
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
          <div className="h-1 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full origin-left bg-accent transition-transform duration-75"
              style={{ transform: `scaleX(${progress ?? 0})` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

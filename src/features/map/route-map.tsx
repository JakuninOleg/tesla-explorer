"use client";

import type { LineString } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import {
  boundsFromCoordinates,
  pointAlongLine,
  type LngLat,
  type MappedStop,
} from "@/features/map/route-geometry";
import "mapbox-gl/dist/mapbox-gl.css";

export type RouteMapProps = {
  stops: MappedStop[];
  line: LineString | null;
  token: string | null;
  missingTokenLabel: string;
  insufficientStopsLabel: string;
  playProgress?: number | null;
};

export function RouteMap({
  stops,
  line,
  token,
  missingTokenLabel,
  insufficientStopsLabel,
  playProgress = null,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const carMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    if (!token || !containerRef.current || stops.length === 0) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: stops[0]!.lngLat,
      zoom: 10,
      attributionControl: true,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    mapRef.current = map;

    const markers: mapboxgl.Marker[] = [];
    const mappedStops = stops;
    const routeLine = line;
    let cancelled = false;

    map.on("load", () => {
      if (cancelled) {
        return;
      }
      for (const stop of mappedStops) {
        const el = document.createElement("div");
        el.className =
          "flex size-6 items-center justify-center rounded-full border border-white/80 bg-[var(--accent)] text-[10px] font-semibold text-white";
        el.textContent = String(stop.listIndex + 1);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(stop.lngLat)
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setText(
              `${stop.name} · ${stop.role}`,
            ),
          )
          .addTo(map);
        markers.push(marker);
      }

      if (routeLine && routeLine.coordinates.length >= 2) {
        map.addSource("route-line", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: routeLine },
        });
        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#e31937",
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });

        const bounds = boundsFromCoordinates(routeLine.coordinates as LngLat[]);
        if (bounds) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 0 });
        }
      } else {
        const bounds = boundsFromCoordinates(mappedStops.map((s) => s.lngLat));
        if (bounds) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 0 });
        }
      }

      const carEl = document.createElement("div");
      carEl.className =
        "size-3 rounded-full bg-white shadow-[0_0_0_3px_rgba(227,25,55,0.85)]";
      carEl.style.display = "none";
      carMarkerRef.current = new mapboxgl.Marker({ element: carEl }).addTo(map);
    });

    return () => {
      cancelled = true;
      for (const marker of markers) {
        marker.remove();
      }
      carMarkerRef.current?.remove();
      carMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token, stops, line]);

  useEffect(() => {
    const marker = carMarkerRef.current;
    const coordinates = line?.coordinates as LngLat[] | undefined;
    if (!marker || !coordinates || coordinates.length === 0) {
      return;
    }

    if (playProgress == null) {
      marker.getElement().style.display = "none";
      return;
    }

    const point = pointAlongLine(coordinates, playProgress);
    if (!point) {
      return;
    }
    marker.getElement().style.display = "block";
    marker.setLngLat(point);
  }, [playProgress, line]);

  if (!token) {
    return (
      <div className="flex h-64 items-center justify-center rounded-sm border border-border bg-muted px-4 text-center text-sm text-muted-foreground">
        {missingTokenLabel}
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-sm border border-border bg-muted px-4 text-center text-sm text-muted-foreground">
        {insufficientStopsLabel}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-sm border border-border md:h-96"
    />
  );
}

"use client";

import type { LineString } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import {
  createCarModelLayer,
  removeCarModelLayer,
  type CarModelPose,
} from "@/features/map/car-model-layer";
import {
  boundsFromCoordinates,
  cameraFollowTarget,
  poseAlongLine,
  type LngLat,
  type MappedStop,
} from "@/features/map/route-geometry";
import { CINEMA_FOLLOW } from "@/features/map/cinema-playback";
import "mapbox-gl/dist/mapbox-gl.css";

export type RouteMapProps = {
  stops: MappedStop[];
  line: LineString | null;
  token: string | null;
  missingTokenLabel: string;
  insufficientStopsLabel: string;
  playProgress?: number | null;
  /** Full-bleed cinema stage (route page hero). */
  cinematic?: boolean;
};

function add3dBuildings(map: mapboxgl.Map) {
  const layers = map.getStyle()?.layers;
  if (!layers) {
    return;
  }
  let labelLayerId: string | undefined;
  for (const layer of layers) {
    if (
      layer.type === "symbol" &&
      layer.layout &&
      "text-field" in layer.layout
    ) {
      labelLayerId = layer.id;
      break;
    }
  }

  if (map.getLayer("tesla-3d-buildings")) {
    return;
  }

  map.addLayer(
    {
      id: "tesla-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#1c1c1c",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          14.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          14.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.85,
      },
    },
    labelLayerId,
  );
}

export function RouteMap({
  stops,
  line,
  token,
  missingTokenLabel,
  insufficientStopsLabel,
  playProgress = null,
  cinematic = false,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const carLayerRef = useRef<ReturnType<typeof createCarModelLayer> | null>(
    null,
  );

  useEffect(() => {
    if (!token || !containerRef.current || stops.length === 0) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: stops[0]!.lngLat,
      zoom: cinematic ? CINEMA_FOLLOW.idleZoom : 11,
      pitch: cinematic ? CINEMA_FOLLOW.pitch : 45,
      bearing: 0,
      antialias: true,
      attributionControl: true,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right",
    );
    mapRef.current = map;

    const markers: mapboxgl.Marker[] = [];
    const mappedStops = stops;
    const routeLine = line;
    let cancelled = false;

    map.on("style.load", () => {
      if (cancelled) {
        return;
      }
      try {
        add3dBuildings(map);
      } catch {
        // Style without composite buildings — still fine.
      }
    });

    map.on("load", () => {
      if (cancelled) {
        return;
      }

      for (const stop of mappedStops) {
        const el = document.createElement("div");
        el.className =
          "flex size-7 items-center justify-center rounded-full border border-white/80 bg-[var(--accent)] text-xs font-semibold text-white shadow-lg";
        el.textContent = String(stop.listIndex + 1);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(stop.lngLat)
          .setPopup(
            new mapboxgl.Popup({ offset: 18 }).setText(
              `${stop.name} · ${stop.role}`,
            ),
          )
          .addTo(map);
        markers.push(marker);
      }

      let carReady = false;
      if (routeLine && routeLine.coordinates.length >= 2) {
        map.addSource("route-line", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: routeLine },
        });
        map.addLayer({
          id: "route-line-glow",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#e31937",
            "line-width": 10,
            "line-opacity": 0.25,
          },
        });
        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#e31937",
            "line-width": 4,
            "line-opacity": 0.95,
          },
        });

        const coords = routeLine.coordinates as LngLat[];
        const startPose = poseAlongLine(coords, 0);
        const carLayer = createCarModelLayer(startPose);
        carLayerRef.current = carLayer;
        map.addLayer(carLayer);
        carReady = Boolean(map.getLayer(carLayer.id));

        if (!cinematic) {
          const bounds = boundsFromCoordinates(coords);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 72,
              maxZoom: 14,
              pitch: 50,
              duration: 0,
            });
          }
        } else if (startPose) {
          map.jumpTo({
            center: cameraFollowTarget(
              startPose,
              CINEMA_FOLLOW.behindMeters,
            ),
            zoom: CINEMA_FOLLOW.idleZoom,
            pitch: CINEMA_FOLLOW.pitch,
            bearing: startPose.headingDeg,
          });
        }
      } else {
        const bounds = boundsFromCoordinates(mappedStops.map((s) => s.lngLat));
        if (bounds) {
          map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 0 });
        }
      }

      const root = containerRef.current;
      if (root) {
        root.dataset.mapReady = "true";
        root.dataset.carLayer = carReady ? "true" : "false";
        root.dataset.stopMarkers = String(markers.length);
      }
    });

    return () => {
      cancelled = true;
      for (const marker of markers) {
        marker.remove();
      }
      if (carLayerRef.current) {
        removeCarModelLayer(map);
        carLayerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [token, stops, line, cinematic]);

  useEffect(() => {
    const map = mapRef.current;
    const carLayer = carLayerRef.current;
    const coordinates = line?.coordinates as LngLat[] | undefined;
    if (!map || !coordinates || coordinates.length < 2) {
      return;
    }

    // Keep the car on-screen at rest (progress null = start of route).
    const progress = playProgress ?? 0;
    const pose = poseAlongLine(coordinates, progress);
    if (!pose) {
      return;
    }

    const carPose: CarModelPose = {
      lngLat: pose.lngLat,
      headingDeg: pose.headingDeg,
    };
    carLayer?.setPose(carPose);

    if (cinematic || playProgress != null) {
      map.jumpTo({
        center: cameraFollowTarget(
          pose,
          cinematic ? CINEMA_FOLLOW.behindMeters : 40,
        ),
        zoom: cinematic ? CINEMA_FOLLOW.zoom : 15.6,
        pitch: cinematic ? CINEMA_FOLLOW.pitch : 58,
        bearing: pose.headingDeg,
      });
    }
  }, [playProgress, line, cinematic]);

  if (!token) {
    return (
      <div className="flex h-72 items-center justify-center rounded-sm border border-border bg-muted px-4 text-center text-base text-muted-foreground">
        {missingTokenLabel}
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-sm border border-border bg-muted px-4 text-center text-base text-muted-foreground">
        {insufficientStopsLabel}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="route-map"
      className={
        cinematic
          ? "h-[min(100dvh,920px)] w-full overflow-hidden bg-black"
          : "h-80 w-full overflow-hidden rounded-sm border border-border md:h-[28rem]"
      }
    />
  );
}

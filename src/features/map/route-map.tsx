"use client";

import type { LineString } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import {
  createCarDomMarker,
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
  /** The parent cinema stage is in native fullscreen. */
  fullScreen?: boolean;
  /** A parked starting-point preview; never fabricates route geometry. */
  stationary?: boolean;
  /** When true, chase-cam sticks to the car; when false, free pan/zoom. */
  followCamera?: boolean;
  onStopSelect?: (listIndex: number) => void;
  focusedStopIndex?: number | null;
  onReadyChange?: (ready: boolean) => void;
};

function applyChaseCamera(
  map: mapboxgl.Map,
  pose: { lngLat: LngLat; headingDeg: number },
) {
  map.jumpTo({
    center: cameraFollowTarget(pose, CINEMA_FOLLOW.behindMeters),
    zoom: CINEMA_FOLLOW.zoom,
    pitch: CINEMA_FOLLOW.pitch,
    bearing: pose.headingDeg,
  });
}

export function RouteMap({
  stops,
  line,
  token,
  missingTokenLabel,
  insufficientStopsLabel,
  playProgress = null,
  cinematic = false,
  fullScreen = false,
  stationary = false,
  followCamera = true,
  onStopSelect,
  focusedStopIndex = null,
  onReadyChange,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const carLayerRef = useRef<ReturnType<typeof createCarModelLayer> | null>(
    null,
  );
  const carMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const followCameraRef = useRef(followCamera);
  const onStopSelectRef = useRef(onStopSelect);
  const onReadyRef = useRef(onReadyChange);
  const progressRef = useRef(playProgress);

  useEffect(() => {
    followCameraRef.current = followCamera;
  }, [followCamera]);

  useEffect(() => {
    onStopSelectRef.current = onStopSelect;
  }, [onStopSelect]);
  useEffect(() => { onReadyRef.current = onReadyChange; }, [onReadyChange]);
  useEffect(() => { progressRef.current = playProgress; }, [playProgress]);

  useEffect(() => {
    if (!token || !containerRef.current || stops.length === 0) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      config: { basemap: { lightPreset: "dusk", showPointOfInterestLabels: !stationary, showTransitLabels: !stationary, showRoadLabels: !stationary } },
      // Three.js custom layers use Mercator coordinates, not globe projection.
      projection: "mercator",
      center: stops[0]!.lngLat,
      zoom: stationary ? 16.4 : cinematic ? CINEMA_FOLLOW.idleZoom : 11,
      pitch: stationary ? 52 : cinematic ? CINEMA_FOLLOW.pitch : 45,
      bearing: stationary ? -22 : 0,
      antialias: true,
      attributionControl: true,
      ...(cinematic
        ? {
            minZoom: 8,
            maxPitch: 80,
            dragRotate: true,
            pitchWithRotate: true,
          }
        : {}),
    });
    // Free look always: pan/zoom while the car drives or on pause.
    map.scrollZoom.enable();
    if (stationary) {
      map.on("resize", () => map.setPadding({ top: 0, bottom: 0, right: 0, left: window.matchMedia("(min-width: 640px)").matches ? map.getContainer().clientWidth * 0.36 : 0 }));
    }
    map.dragPan.enable();
    map.touchPitch.enable();
    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
        showZoom: true,
      }),
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
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", stop.name);
        el.dataset.testid = `route-stop-marker-${stop.listIndex}`;
        el.className =
          "flex max-w-52 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-[#071016]/90 py-1 pr-3 pl-1 text-xs font-medium text-white shadow-lg";
        const number = document.createElement("span");
        number.className = "flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#071016]";
        number.textContent = String(stop.listIndex + 1);
        const name = document.createElement("span");
        name.className = "max-w-32 truncate";
        name.textContent = stop.name;
        el.append(number, name);
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onStopSelectRef.current?.(stop.listIndex);
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -20] })
          .setLngLat(stop.lngLat)
          .setPopup(
            new mapboxgl.Popup({ offset: 18 }).setText(
              stop.name,
            ),
          )
          .addTo(map);
        markers.push(marker);
      }

      let carReady = false;
      const installCar = (pose: CarModelPose) => {
        const carEl = createCarDomMarker();
        const marker = new mapboxgl.Marker({ element: carEl, rotationAlignment: "map", pitchAlignment: "map" })
          .setLngLat(pose.lngLat).setRotation(pose.headingDeg).addTo(map);
        carMarkerRef.current = marker;
        const layer = createCarModelLayer(pose, (ready) => {
          if (cancelled) return;
          carEl.hidden = ready;
          if (containerRef.current) containerRef.current.dataset.carModelReady = String(ready);
        });
        carLayerRef.current = layer;
        try {
          map.addLayer(layer);
          return Boolean(map.getLayer(layer.id));
        } catch {
          // Keep the DOM marker usable if the shared WebGL renderer fails.
          return false;
        }
      };
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
            "line-emissive-strength": 1,
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
            "line-emissive-strength": 1,
          },
        });

        const coords = routeLine.coordinates as LngLat[];
        const startPose = poseAlongLine(coords, progressRef.current ?? 0);
        if (startPose) carReady = installCar(startPose);

        if (!cinematic || !followCameraRef.current) {
          const bounds = boundsFromCoordinates(coords);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 72,
              maxZoom: 17,
              pitch: 50,
              duration: 0,
            });
          }
        } else if (startPose && followCameraRef.current) {
          applyChaseCamera(map, startPose);
        }
      } else if (stationary) {
        const pose = { lngLat: mappedStops[0]!.lngLat, headingDeg: 0 };
        carReady = installCar(pose);
        // Leave room for the dashboard composer without inventing a route.
        map.setPadding({ top: 0, bottom: 0, right: 0, left: window.matchMedia("(min-width: 640px)").matches ? map.getContainer().clientWidth * 0.36 : 0 });
      } else {
        const bounds = boundsFromCoordinates(mappedStops.map((s) => s.lngLat));
        if (bounds) {
          map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 0 });
        }
      }

      const root = containerRef.current;
      onReadyRef.current?.(true);
      if (root) {
        root.dataset.mapReady = "true";
        root.dataset.carLayer = carReady ? "true" : "false";
        root.dataset.carMarker = carMarkerRef.current ? "true" : "false";
        root.dataset.stopMarkers = String(markers.length);
      }
    });

    return () => {
      cancelled = true;
      onReadyRef.current?.(false);
      for (const marker of markers) {
        marker.remove();
      }
      carMarkerRef.current?.remove();
      carMarkerRef.current = null;
      if (carLayerRef.current) {
        removeCarModelLayer(map);
        carLayerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [token, stops, line, cinematic, stationary]);

  useEffect(() => {
    const stop = stops.find((item) => item.listIndex === focusedStopIndex);
    if (stop && mapRef.current) mapRef.current.easeTo({ center: stop.lngLat, zoom: 17, pitch: 55, duration: 650 });
  }, [focusedStopIndex, stops]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [fullScreen]);

  useEffect(() => {
    const map = mapRef.current;
    const carLayer = carLayerRef.current;
    const carMarker = carMarkerRef.current;
    const coordinates = line?.coordinates as LngLat[] | undefined;
    if (!map || !coordinates || coordinates.length < 2) {
      return;
    }

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

    if (carMarker) {
      carMarker.setLngLat(pose.lngLat);
      carMarker.setRotation(pose.headingDeg);
    }

    if (followCamera && (cinematic || playProgress != null)) {
      applyChaseCamera(map, pose);
    }
  }, [playProgress, line, cinematic, followCamera]);

  if (!token) {
    return (
      <div className={`flex ${cinematic ? fullScreen ? "min-h-0 flex-1 items-start pt-12" : "h-[32rem] items-start pt-12 md:h-[34rem]" : "h-72 items-center"} justify-center rounded-sm border border-border bg-muted px-4 text-center text-sm text-muted-foreground`}>
        {missingTokenLabel}
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className={`flex ${cinematic ? fullScreen ? "min-h-0 flex-1 items-start pt-12" : "h-[32rem] items-start pt-12 md:h-[34rem]" : "h-72 items-center"} justify-center rounded-sm border border-border bg-muted px-4 text-center text-sm text-muted-foreground`}>
        {insufficientStopsLabel}
      </div>
    );
  }

  return (
    <div className={`relative ${fullScreen ? "flex min-h-0 flex-1 flex-col" : ""}`}>
    <div
      ref={containerRef}
      data-testid="route-map"
      data-play-progress={playProgress ?? 0}
      className={
        cinematic
          ? fullScreen
            ? "min-h-0 flex-1 w-full overflow-hidden bg-black"
            : "h-[32rem] w-full overflow-hidden bg-black md:h-[34rem]"
          : "h-80 w-full overflow-hidden rounded-sm border border-border md:h-[28rem]"
      }
    />
    <a href="/models/tesla-model-3/CREDITS.md" target="_blank" rel="noreferrer" className="absolute bottom-8 left-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white/80 hover:text-white">Tesla Model 3 · iSteven · CC BY-NC 4.0</a>
    </div>
  );
}

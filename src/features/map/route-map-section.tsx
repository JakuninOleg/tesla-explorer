import { getTranslations } from "next-intl/server";
import { fetchDrivingGeometry } from "@/features/map/fetch-directions";
import { stopsWithCoordinates } from "@/features/map/route-geometry";
import { RouteMap } from "@/features/map/route-map";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export async function RouteMapSection({ stops }: { stops: ItineraryStop[] }) {
  const t = await getTranslations("RouteDetail");
  const mapped = stopsWithCoordinates(stops);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || null;
  const line =
    mapped.length >= 2 ? await fetchDrivingGeometry(mapped) : null;

  return (
    <section>
      <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {t("map")}
      </h2>
      <div className="mt-4">
        <RouteMap
          stops={mapped}
          line={line}
          token={token}
          missingTokenLabel={t("mapMissingToken")}
          insufficientStopsLabel={t("mapNoCoordinates")}
        />
      </div>
    </section>
  );
}

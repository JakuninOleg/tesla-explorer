import { getTranslations } from "next-intl/server";
import { buildRouteStage } from "@/features/map/build-route-stage";
import { RouteCinema } from "@/features/map/route-cinema";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export async function RouteMapSection({
  stops,
  status,
}: {
  stops: ItineraryStop[];
  status?: "proposed" | "approved" | "declined";
}) {
  const t = await getTranslations("RouteDetail");
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || null;
  const stage = await buildRouteStage(stops, {
    token: token ?? undefined,
  });
  const cinematic = status === "approved" || status === "proposed";

  return (
    <section className={cinematic ? "-mx-6 md:-mx-10" : undefined}>
      <h2
        className={
          cinematic
            ? "px-6 text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-10"
            : "text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase"
        }
      >
        {t("map")}
      </h2>
      <div className={cinematic ? "mt-3" : "mt-4"}>
        <RouteCinema
          stops={stage.mapped}
          line={stage.line}
          token={token}
          missingTokenLabel={t("mapMissingToken")}
          insufficientStopsLabel={t("mapNoCoordinates")}
          playLabel={t("cinemaPlay")}
          pauseLabel={t("cinemaPause")}
          replayLabel={t("cinemaReplay")}
          chargePulseLabel={t("cinemaCharging")}
          continueLabel={t("cinemaContinue")}
          watchPlaceLabel={t("cinemaWatchPlace")}
          openYoutubeLabel={t("placeYoutube")}
          followLabel={t("cinemaFollow")}
          freeCamLabel={t("cinemaFreeCam")}
          scrubLabel={t("cinemaScrub")}
          speedLabel={t("cinemaSpeed")}
          cinematic={cinematic}
          autoPlay={status === "approved"}
          itineraryStops={stops}
        />
      </div>
    </section>
  );
}

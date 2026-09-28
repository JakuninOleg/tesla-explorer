"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { planRouteInputSchema } from "@/features/routes/itinerary-schema";
import {
  approveRouteAction,
  declineRouteAction,
  planRouteAction,
} from "@/features/routes/route-actions";
import { useRouter } from "@/i18n/navigation";
import type { StartAnchor } from "@/db/schema";
import { LandingIcon } from "@/features/marketing/landing-icon";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#e82142] focus:ring-2 focus:ring-[#e82142]/10";

export function RouteDecisionPanel({
  routeId,
  requestPrompt,
  availableHours,
  batteryPercent,
  startAnchor,
  startOtherText,
  startOtherLat,
  startOtherLng,
}: {
  routeId: string;
  requestPrompt: string;
  availableHours: number;
  batteryPercent: number;
  startAnchor: StartAnchor;
  startOtherText: string | null;
  startOtherLat: number | null;
  startOtherLng: number | null;
}) {
  const router = useRouter();
  const t = useTranslations("RouteDetail");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);

  async function run(action: "approve" | "decline" | "adjust") {
    setError(null);
    setPending(true);
    try {

    if (action === "approve") {
      const result = await approveRouteAction({ routeId });
      setPending(false);
      if (!result.ok) {
        setError(t("errorSave"));
        return;
      }
      router.refresh();
      return;
    }

    if (action === "decline") {
      const result = await declineRouteAction({ routeId });
      setPending(false);
      if (!result.ok) {
        setError(t("errorSave"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const parsed = planRouteInputSchema.safeParse({
      requestPrompt,
      availableHours,
      batteryPercent,
      startAnchor,
      startOtherText: startOtherText ?? "",
      startOtherLat,
      startOtherLng,
      adjustOfRouteId: routeId,
      adjustNotes,
    });

    if (!parsed.success) {
      setPending(false);
      setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
      return;
    }

    const result = await planRouteAction(parsed.data);
    setPending(false);
    if (!result.ok) {
      setError(result.message ?? t("errorSave"));
      return;
    }
    setShowAdjust(false);
    setAdjustNotes("");
    router.refresh();
    } catch {
      setError(t("errorSave"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/7 pb-5">
        <div><h2 className="text-lg font-semibold tracking-tight">{t("decision")}</h2><p className="mt-1 text-sm text-black/50">{t("decisionIntro")}</p></div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff3f5] text-[#e31937]"><LandingIcon name="spark" className="size-5" /></span>
      </div>
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("approve")}
          className="group inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e31937] px-5 text-sm font-medium text-white transition-colors hover:bg-[#c4122d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31937] disabled:cursor-wait disabled:opacity-60"
        >
          {t("approve")}<LandingIcon name="arrow" className="size-4 transition-transform motion-safe:group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowAdjust((value) => !value)}
          aria-expanded={showAdjust}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-[#f6f7f8] disabled:cursor-wait disabled:opacity-60"
        >
          {t("adjust")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("decline")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm text-muted-foreground transition-colors hover:bg-[#f6f7f8] hover:text-foreground disabled:cursor-wait disabled:opacity-60"
        >
          {t("decline")}
        </button>
      </div>

      {showAdjust ? (
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              {t("adjustNotes")}
            </span>
            <textarea
              rows={3}
              value={adjustNotes}
              onChange={(event) => setAdjustNotes(event.target.value)}
              placeholder={t("adjustNotesPlaceholder")}
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            disabled={pending || adjustNotes.trim().length < 4}
            onClick={() => void run("adjust")}
            className="inline-flex h-11 w-fit cursor-pointer items-center justify-center rounded-xl bg-[#e31937] px-5 text-sm font-medium text-white transition-colors hover:bg-[#c4122d] disabled:cursor-wait disabled:opacity-60"
          >
            {t("adjustSubmit")}
          </button>
        </div>
      ) : null}

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
    </section>
  );
}

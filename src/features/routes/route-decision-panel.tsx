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

const fieldClass =
  "mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/40";

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
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("approve")}
          className="inline-flex h-11 items-center justify-center rounded-sm bg-accent px-5 text-xs font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {t("approve")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowAdjust((value) => !value)}
          className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-foreground/40 disabled:opacity-60"
        >
          {t("adjust")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("decline")}
          className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-5 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
        >
          {t("decline")}
        </button>
      </div>

      {showAdjust ? (
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
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
            className="inline-flex h-11 w-fit items-center justify-center rounded-sm bg-accent px-5 text-xs font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {t("adjustSubmit")}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

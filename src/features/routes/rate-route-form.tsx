"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { rateRouteInputSchema } from "@/features/routes/itinerary-schema";
import { rateRouteAction } from "@/features/routes/route-actions";
import { useRouter } from "@/i18n/navigation";

const fieldClass =
  "mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/40";

const labelClass =
  "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase";

export function RateRouteForm({
  routeId,
  initialRating,
  initialImpressionNotes,
  initialPreferenceNotes,
}: {
  routeId: string;
  initialRating: number | null;
  initialImpressionNotes: string | null;
  initialPreferenceNotes: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("RouteDetail");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSaved(false);
        setPending(true);

        const form = new FormData(event.currentTarget);
        const raw = {
          routeId,
          rating: form.get("rating"),
          impressionNotes: String(form.get("impressionNotes") ?? ""),
          preferenceNotes: String(form.get("preferenceNotes") ?? ""),
        };

        const parsed = rateRouteInputSchema.safeParse(raw);
        if (!parsed.success) {
          setPending(false);
          setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
          return;
        }

        void (async () => {
          const result = await rateRouteAction(parsed.data);
          setPending(false);
          if (!result.ok) {
            setError(
              result.error === "unauthorized"
                ? t("errorUnauthorized")
                : result.error === "not_approved"
                  ? t("errorNotApproved")
                  : t("errorSave"),
            );
            return;
          }
          setSaved(true);
          router.refresh();
        })();
      }}
    >
      <label className="block">
        <span className={labelClass}>{t("rating")}</span>
        <select
          name="rating"
          required
          defaultValue={initialRating ?? 5}
          className={fieldClass}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>{t("impressions")}</span>
        <textarea
          name="impressionNotes"
          rows={3}
          defaultValue={initialImpressionNotes ?? ""}
          placeholder={t("impressionsPlaceholder")}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{t("preferences")}</span>
        <textarea
          name="preferenceNotes"
          rows={3}
          defaultValue={initialPreferenceNotes ?? ""}
          placeholder={t("preferencesPlaceholder")}
          className={fieldClass}
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">{t("saved")}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {t("saveFeedback")}
      </button>
    </form>
  );
}

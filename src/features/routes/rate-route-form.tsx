"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { rateRouteInputSchema } from "@/features/routes/itinerary-schema";
import { rateRouteAction } from "@/features/routes/route-actions";
import { useRouter } from "@/i18n/navigation";
import { LandingIcon } from "@/features/marketing/landing-icon";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#e82142] focus:ring-2 focus:ring-[#e82142]/10";

const labelClass =
  "text-sm font-medium text-foreground";

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
      id="rating"
      className="flex scroll-mt-24 flex-col gap-5"
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
          try {
            const result = await rateRouteAction(parsed.data);
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
          } catch {
            setError(t("errorSave"));
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="flex items-center gap-3 rounded-xl bg-[#f6f7f8] p-4 text-sm leading-relaxed text-black/60"><LandingIcon name="star" className="size-5 shrink-0 text-[#e31937]" />{t("feedbackIntro")}</div>
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

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">{t("saved")}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex h-12 w-fit cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#e31937] px-6 text-sm font-medium text-white transition-colors hover:bg-[#c4122d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e31937] disabled:cursor-wait disabled:opacity-60"
      >
        {t("saveFeedback")}<LandingIcon name="arrow" className="size-4 transition-transform motion-safe:group-hover:translate-x-1" />
      </button>
    </form>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { planRouteInputSchema } from "@/features/routes/itinerary-schema";
import { planRouteAction } from "@/features/routes/route-actions";
import { useRouter } from "@/i18n/navigation";

const fieldClass =
  "mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/40";

const labelClass =
  "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase";

export function PlanRouteForm({
  defaultBatteryPercent,
}: {
  defaultBatteryPercent: number;
}) {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setPending(true);

        const form = new FormData(event.currentTarget);
        const raw = {
          requestPrompt: String(form.get("requestPrompt") ?? ""),
          availableHours: form.get("availableHours"),
          batteryPercent: form.get("batteryPercent"),
        };

        const parsed = planRouteInputSchema.safeParse(raw);
        if (!parsed.success) {
          setPending(false);
          setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
          return;
        }

        void (async () => {
          const result = await planRouteAction(parsed.data);
          if (!result.ok) {
            setPending(false);
            if (result.error === "unauthorized") {
              setError(t("errorUnauthorized"));
            } else if (result.error === "no_profile") {
              setError(t("errorNoProfile"));
            } else if (result.error === "ai") {
              setError(result.message ?? t("errorAi"));
            } else if (result.error === "parse") {
              setError(t("errorParse"));
            } else {
              setError(t("errorSave"));
            }
            return;
          }

          router.push(`/routes/${result.id}`);
          router.refresh();
        })();
      }}
    >
      <label className="block">
        <span className={labelClass}>{t("prompt")}</span>
        <textarea
          name="requestPrompt"
          required
          rows={4}
          placeholder={t("promptPlaceholder")}
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className={labelClass}>{t("hours")}</span>
          <input
            name="availableHours"
            type="number"
            required
            min={1}
            max={16}
            defaultValue={3}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("battery")}</span>
          <input
            name="batteryPercent"
            type="number"
            required
            min={1}
            max={100}
            defaultValue={defaultBatteryPercent}
            className={fieldClass}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t("planning") : t("plan")}
      </button>
    </form>
  );
}

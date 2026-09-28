"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AddressAutocomplete } from "@/features/geo/address-autocomplete";
import { planRouteInputSchema } from "@/features/routes/itinerary-schema";
import { planRouteAction } from "@/features/routes/route-actions";
import { useRouter } from "@/i18n/navigation";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#e82142] focus:ring-2 focus:ring-[#e82142]/10";

const labelClass =
  "text-sm font-medium text-foreground";

function readCoord(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function PlanRouteForm({
  homeLabel,
  workLabel,
}: {
  homeLabel: string;
  workLabel: string;
}) {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [startAnchor, setStartAnchor] = useState<"home" | "work" | "other">(
    "work",
  );

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
          startAnchor: String(form.get("startAnchor") ?? "home"),
          startOtherText: String(form.get("otherAddress") ?? ""),
          startOtherLat: readCoord(form.get("otherLat")),
          startOtherLng: readCoord(form.get("otherLng")),
        };

        const parsed = planRouteInputSchema.safeParse(raw);
        if (!parsed.success) {
          setPending(false);
          setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
          return;
        }

        void (async () => {
          try {
            const result = await planRouteAction(parsed.data);
            if (!result.ok) {
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
          } catch {
            setError(t("errorSave"));
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <fieldset>
        <legend className={labelClass}>{t("startFrom")}</legend>
        <div className="mt-3 flex flex-col gap-2">
          {(
            [
              ["home", t("startHome", { address: homeLabel })],
              ["work", t("startWork", { address: workLabel })],
              ["other", t("startOther")],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm transition-colors has-[:checked]:border-[#e82142] has-[:checked]:bg-[#fff5f6]"
            >
              <input
                type="radio"
                name="startAnchor"
                value={value}
                checked={startAnchor === value}
                onChange={() => setStartAnchor(value)}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {startAnchor === "other" ? (
        <AddressAutocomplete
          label={t("otherAddress")}
          namePrefix="other"
          placeholder={t("otherAddressPlaceholder")}
          searchUnavailableHint={t("addressSearchUnavailable")}
        />
      ) : null}

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
            defaultValue={60}
            className={fieldClass}
          />
        </label>
      </div>

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-[#e31937] px-6 text-sm font-medium text-white transition-colors hover:bg-[#c4122d] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? t("planning") : t("plan")}
      </button>
    </form>
  );
}

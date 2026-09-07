"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  TESLA_MODELS,
  onboardingSchema,
  type OnboardingInput,
} from "@/features/profile/onboarding-schema";
import { saveProfileAction } from "@/features/profile/profile-actions";
import { useRouter } from "@/i18n/navigation";

const fieldClass =
  "mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/40";

const labelClass = "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase";

export function OnboardingForm({
  initialProfile,
}: {
  initialProfile?: OnboardingInput | null;
}) {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-10 flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setPending(true);

        const form = new FormData(event.currentTarget);
        const raw = {
          homePlace: String(form.get("homePlace") ?? ""),
          household: String(form.get("household") ?? ""),
          interests: String(form.get("interests") ?? ""),
          teslaModel: String(form.get("teslaModel") ?? ""),
          batteryPercent: form.get("batteryPercent"),
        };

        const parsed = onboardingSchema.safeParse(raw);
        if (!parsed.success) {
          setPending(false);
          setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
          return;
        }

        void (async () => {
          const result = await saveProfileAction(parsed.data);
          if (!result.ok) {
            setPending(false);
            setError(
              result.error === "unauthorized" ? t("errorUnauthorized") : t("errorSave"),
            );
            return;
          }
          setPending(false);
          router.push("/");
          router.refresh();
        })();
      }}
    >
      <label className="block">
        <span className={labelClass}>{t("homePlace")}</span>
        <input
          name="homePlace"
          type="text"
          required
          autoComplete="address-level2"
          defaultValue={initialProfile?.homePlace ?? ""}
          placeholder={t("homePlacePlaceholder")}
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>{t("household")}</legend>
        <div className="mt-3 flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-3 text-sm has-[:checked]:border-accent">
            <input
              type="radio"
              name="household"
              value="solo"
              defaultChecked={(initialProfile?.household ?? "solo") === "solo"}
              className="accent-[var(--accent)]"
            />
            {t("solo")}
          </label>
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-3 text-sm has-[:checked]:border-accent">
            <input
              type="radio"
              name="household"
              value="family"
              defaultChecked={initialProfile?.household === "family"}
              className="accent-[var(--accent)]"
            />
            {t("family")}
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className={labelClass}>{t("interests")}</span>
        <textarea
          name="interests"
          required
          rows={3}
          defaultValue={initialProfile?.interests ?? ""}
          placeholder={t("interestsPlaceholder")}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{t("teslaModel")}</span>
        <select
          name="teslaModel"
          required
          defaultValue={initialProfile?.teslaModel ?? "Model Y"}
          className={fieldClass}
        >
          {TESLA_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>{t("battery")}</span>
        <input
          name="batteryPercent"
          type="number"
          required
          min={1}
          max={100}
          defaultValue={initialProfile?.batteryPercent ?? 60}
          className={fieldClass}
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {t("submit")}
      </button>
    </form>
  );
}

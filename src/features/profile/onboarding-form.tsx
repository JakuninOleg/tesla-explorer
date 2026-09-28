"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { AddressAutocomplete } from "@/features/geo/address-autocomplete";
import {
  TESLA_MODELS,
  onboardingSchema,
  type OnboardingInput,
} from "@/features/profile/onboarding-schema";
import { saveProfileAction } from "@/features/profile/profile-actions";
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
      className="mt-7"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setPending(true);

        const form = new FormData(event.currentTarget);
        const raw = {
          homeAddress: String(form.get("homeAddress") ?? ""),
          homeLat: readCoord(form.get("homeLat")),
          homeLng: readCoord(form.get("homeLng")),
          workAddress: String(form.get("workAddress") ?? ""),
          workLat: readCoord(form.get("workLat")),
          workLng: readCoord(form.get("workLng")),
          household: String(form.get("household") ?? ""),
          kidsCount: Number(form.get("kidsCount") ?? 0),
          aboutMe: String(form.get("aboutMe") ?? ""),
          interests: String(form.get("interests") ?? ""),
          teslaModel: String(form.get("teslaModel") ?? ""),
        };

        const parsed = onboardingSchema.safeParse(raw);
        if (!parsed.success) {
          setPending(false);
          setError(parsed.error.issues[0]?.message ?? t("errorGeneric"));
          return;
        }

        void (async () => {
          try {
          const result = await saveProfileAction(parsed.data);
          if (!result.ok) {
            setPending(false);
            setError(
              result.error === "unauthorized"
                ? t("errorUnauthorized")
                : t("errorSave"),
            );
            return;
          }
          setPending(false);
          router.push("/dashboard");
          router.refresh();
          } catch {
            setError(t("errorSave"));
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-5 disabled:opacity-70 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
      <section className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <h2 className="flex items-center gap-3 text-lg font-semibold"><LandingIcon name="home" />{t("addressesTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("addressesHint")}</p>
      <AddressAutocomplete
        label={t("homeAddress")}
        namePrefix="home"
        placeholder={t("homeAddressPlaceholder")}
        searchUnavailableHint={t("addressSearchUnavailable")}
        initial={{
          address: initialProfile?.homeAddress ?? "",
          lat: initialProfile?.homeLat ?? null,
          lng: initialProfile?.homeLng ?? null,
        }}
      />

      <AddressAutocomplete
        label={t("workAddress")}
        namePrefix="work"
        placeholder={t("workAddressPlaceholder")}
        searchUnavailableHint={t("addressSearchUnavailable")}
        initial={{
          address: initialProfile?.workAddress ?? "",
          lat: initialProfile?.workLat ?? null,
          lng: initialProfile?.workLng ?? null,
        }}
      />

      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
      <h2 className="flex items-center gap-3 text-lg font-semibold"><LandingIcon name="spark" />{t("preferencesTitle")}</h2>
      <fieldset>
        <legend className={labelClass}>{t("household")}</legend>
        <div className="mt-3 flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition-colors has-[:checked]:border-[#e82142] has-[:checked]:bg-[#fff5f6]">
            <input
              type="radio"
              name="household"
              value="solo"
              defaultChecked={(initialProfile?.household ?? "solo") === "solo"}
              className="accent-[var(--accent)]"
            />
            {t("solo")}
          </label>
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition-colors has-[:checked]:border-[#e82142] has-[:checked]:bg-[#fff5f6]">
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
        <span className={labelClass}>{t("kidsCount")}</span>
        <input
          type="number"
          name="kidsCount"
          min={0}
          max={8}
          defaultValue={initialProfile?.kidsCount ?? 0}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{t("aboutMe")}</span>
        <textarea
          name="aboutMe"
          maxLength={280}
          rows={2}
          defaultValue={initialProfile?.aboutMe ?? ""}
          placeholder={t("aboutMePlaceholder")}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{t("interests")}</span>
        <textarea
          name="interests"
          required
          maxLength={240}
          rows={3}
          defaultValue={initialProfile?.interests ?? ""}
          placeholder={t("interestsPlaceholder")}
          className={fieldClass}
        />
      </label>

      </section>
      </div>
      <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-border bg-white p-5 sm:p-7">
        <h2 className="flex items-center gap-3 text-lg font-semibold"><LandingIcon name="car" />{t("vehicleTitle")}</h2>
        <Image src="/marketing/redesign/dashboard-tesla.png" alt="" width={1536} height={1024} className="my-4 aspect-[3/2] w-full object-contain" />
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

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("vehicleHint")}</p>
        <div className="mt-6 flex gap-3 rounded-xl bg-[#f6f7f8] p-4 text-sm leading-relaxed text-muted-foreground"><LandingIcon name="bolt" className="mt-0.5 size-5 shrink-0" />{t("batteryHint")}</div>
      </section>
      </fieldset>
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <p role={error ? "alert" : undefined} className={error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{error ?? t("saveHint")}</p>

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#e82142] px-6 text-sm font-medium text-white transition-colors hover:bg-[#d41938] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e82142] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? t("saving") : t("submit")}<LandingIcon name="arrow" className="size-4 transition-transform motion-safe:group-hover:translate-x-1" />
      </button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TESLA_MODELS,
  onboardingSchema,
  type OnboardingInput,
} from "@/features/profile/onboarding-schema";

const PROFILE_STORAGE_KEY = "tesla-explorer.profile.v1";

const fieldClass =
  "mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/40";

const labelClass = "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase";

export function OnboardingForm() {
  const router = useRouter();
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
          setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
          return;
        }

        const profile: OnboardingInput = parsed.data;
        try {
          window.sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {
          setPending(false);
          setError("Could not save your profile on this device.");
          return;
        }

        setPending(false);
        router.push("/");
      }}
    >
      <label className="block">
        <span className={labelClass}>Home base</span>
        <input
          name="homePlace"
          type="text"
          required
          autoComplete="address-level2"
          placeholder="City or neighborhood in the USA"
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>Who is coming</legend>
        <div className="mt-3 flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-3 text-sm has-[:checked]:border-accent">
            <input type="radio" name="household" value="solo" defaultChecked className="accent-[var(--accent)]" />
            Solo
          </label>
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-3 text-sm has-[:checked]:border-accent">
            <input type="radio" name="household" value="family" className="accent-[var(--accent)]" />
            Family
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className={labelClass}>Interests</span>
        <textarea
          name="interests"
          required
          rows={3}
          placeholder="Food you like, places you enjoy, things to avoid"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Tesla model</span>
        <select name="teslaModel" required defaultValue="Model Y" className={fieldClass}>
          {TESLA_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Battery now (%)</span>
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        Save profile
      </button>
    </form>
  );
}

export { PROFILE_STORAGE_KEY };

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { OnboardingForm } from "./onboarding-form";
import type { OnboardingInput } from "./onboarding-schema";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/profile/profile-actions", () => ({ saveProfileAction: vi.fn() }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props) }));
beforeAll(() => { vi.stubGlobal("React", React); });

describe("onboarding form", () => {
  it("preserves saved fields and coordinates in the redesigned sections", () => {
    const profile: OnboardingInput = {
      homeAddress: "Austin City Hall", homeLat: 30.264, homeLng: -97.747,
      workAddress: "Austin Central Library", workLat: 30.266, workLng: -97.752,
      household: "family", kidsCount: 2, aboutMe: "Evening walks",
      interests: "Parks and cafes", teslaModel: "Model 3",
    };
    const html = renderToStaticMarkup(<OnboardingForm initialProfile={profile} />);
    for (const key of ["homeAddress", "homeLat", "homeLng", "workAddress", "workLat", "workLng", "household", "kidsCount", "aboutMe", "interests", "teslaModel"]) {
      expect(html).toContain(`name="${key}"`);
    }
    expect(html).toContain('name="homeLat" value="30.264"');
    expect(html).toContain('value="Model 3" selected=""');
    expect(html).toContain("Parks and cafes");
    expect(html).toContain("addressesTitle");
    expect(html).toContain("preferencesTitle");
    expect(html).toContain("vehicleTitle");
  });

  it("renders a usable empty profile without introducing a battery field", () => {
    const html = renderToStaticMarkup(<OnboardingForm />);
    expect(html).toContain('type="submit"');
    expect(html).toContain('value="Model Y" selected=""');
    expect(html).not.toContain('name="batteryPercent"');
    expect(html).toContain('maxLength="240"');
    expect(html).toContain('for=');
  });
});

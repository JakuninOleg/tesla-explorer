import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTranslator } from "next-intl";
import ru from "../../../messages/ru.json";
import en from "../../../messages/en.json";

let locale: "ru" | "en" = "ru";
vi.mock("next-intl/server", () => ({
  getLocale: async () => locale,
  getTranslations: async (namespace: "Home" | "Workspace") =>
    createTranslator({ locale, messages: locale === "ru" ? ru : en, namespace }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    createElement("a", { ...props, href: "/" + locale + href }, children),
}));
vi.mock("@/components/locale-switcher", () => ({ LocaleSwitcher: () => null }));
vi.mock("next/font/google", () => ({ Roboto: () => ({ className: "landing-font" }) }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/features/marketing/landing-dashboard-preview", () => ({
  LandingDashboardPreview: () => createElement("div", null, "Workspace preview"),
}));
vi.mock("@/features/marketing/landing-car-section", () => ({
  LandingCarSection: () => createElement("section", { id: "car" }),
}));
import { LandingPage } from "./landing-page";

describe("landing visitor journey", () => {
  for (const language of ["ru", "en"] as const) {
    it(language + ": advertises only available actions and links credit to portfolio", async () => {
      locale = language;
      const copy = language === "ru" ? ru.Home : en.Home;
      const html = renderToStaticMarkup(await LandingPage({ theme: "dark" }));
      expect(html).not.toContain(copy.ctaVideo);
      expect(html).not.toContain(copy.navReviews);
      expect(html).not.toContain(copy.ideasMore);
      expect(html).not.toContain(copy.footerBlog);
      expect(html).not.toContain(copy.footerContacts);
      expect(html).toContain(copy.howTry);
      expect(html).toContain('href="/' + language + '/sign-in"');
      expect(html).toContain('href="https://jakuninoleg.dev"');
      expect(html).toContain(copy.footerCredit);
      expect(html).toContain(copy.footerPrivacy);
      expect(html).toContain(copy.footerTerms);
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).toContain('id="features"');
      expect(html).toContain('id="ideas"');
      expect(html).toContain(`tesla-explorer-${language}.png`);
      expect(html).not.toContain(language === "ru" ? "Сменить тему" : "Toggle theme");
    });
  }
});

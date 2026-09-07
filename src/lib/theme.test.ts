import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "theme") {
        return { value: process.env.TEST_THEME_COOKIE };
      }
      return undefined;
    },
  }),
}));

describe("getServerTheme", () => {
  it("defaults to dark when cookie is missing", async () => {
    delete process.env.TEST_THEME_COOKIE;
    const { getServerTheme } = await import("@/lib/theme");
    await expect(getServerTheme()).resolves.toBe("dark");
  });

  it("returns light when cookie is light", async () => {
    process.env.TEST_THEME_COOKIE = "light";
    vi.resetModules();
    const { getServerTheme } = await import("@/lib/theme");
    await expect(getServerTheme()).resolves.toBe("light");
    delete process.env.TEST_THEME_COOKIE;
  });
});

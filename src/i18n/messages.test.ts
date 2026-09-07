import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";

function nestedKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    nestedKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n message catalogs", () => {
  it("en and ru share the same namespaces and nested keys", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort());
    expect(nestedKeys(en).sort()).toEqual(nestedKeys(ru).sort());
  });

  it("keeps product-facing home copy without internal labels", () => {
    expect(en.Home.cta).toBe("Get started");
    expect(ru.Home.cta).toBe("Начать");
    expect(en.Home.disclaimer.toLowerCase()).not.toMatch(/pet|sprint/);
    expect(ru.Home.disclaimer.toLowerCase()).not.toMatch(/pet|sprint/);
  });
});

import { test, expect } from "@playwright/test";
import { seedE2ESession } from "./helpers/seed-session";

const hasSecrets = Boolean(
  process.env.DATABASE_URL &&
    process.env.AUTH_SECRET &&
    process.env.GO_AI_BASE_URL &&
    process.env.GO_AI_SHARED_SECRET &&
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
);

test.describe("human trip in the browser", () => {
  test.skip(!hasSecrets, "Needs DATABASE_URL, AUTH_SECRET, GO_AI_*, Mapbox");

  test("dashboard chat → route page with Mapbox canvas + 3D car layer", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedE2ESession();

    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        url: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/ru/dashboard");
    await expect(page.getByTestId("plan-chat")).toBeVisible();

    const request =
      "Хочу покушать китайской еды и прогуляться со своими детишками где-то возле воды";

    await page.getByTestId("plan-chat-input").fill(request);
    await page.getByTestId("plan-chat-send").click();

    await expect(page.getByTestId("plan-chat-error")).toHaveCount(0, {
      timeout: 5_000,
    });

    await page.waitForURL(/\/ru\/routes\/[0-9a-f-]{36}/i, {
      timeout: 120_000,
    });

    await expect(page.getByTestId("route-cinema")).toBeVisible();
    await expect(page.getByTestId("route-map")).toBeVisible();

    const map = page.getByTestId("route-map");
    await expect(map).toHaveAttribute("data-map-ready", "true", {
      timeout: 60_000,
    });
    await expect(map).toHaveAttribute("data-car-layer", "true");
    await expect(map).toHaveAttribute("data-car-marker", "true");
    await expect(map).toHaveAttribute("data-stop-markers", /[1-9]/);

    const canvas = map.locator("canvas.mapboxgl-canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);

    const carMarker = page.getByTestId("route-car-marker");
    await expect(carMarker).toBeVisible();

    await expect(page.getByTestId("route-cinema-play")).toBeVisible();
    await page.getByTestId("route-cinema-play").click();
    await page.waitForTimeout(2000);
    await expect(carMarker).toBeVisible();
    await expect(canvas).toBeVisible();
  });
});

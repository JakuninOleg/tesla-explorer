import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("landing marketing surface", () => {
  it("uses live HTML product previews like Okhana, not desktop screenshots", () => {
    const root = join(process.cwd(), "src/features/marketing");
    const page = readFileSync(join(root, "landing-page.tsx"), "utf8");
    const previews = readFileSync(join(root, "landing-product-previews.tsx"), "utf8");
    expect(page).toContain("CabinetChatPreview");
    expect(page).toContain("RouteCinemaPreview");
    expect(page).toContain("PlaceStopPreview");
    expect(page).toContain("HeroStack");
    expect(page).not.toContain("/marketing/cabinet-chat.png");
    expect(previews).toContain("DemoShell");
    expect(previews).toContain("demoPlay");
    expect(previews).toContain("LandingEvStage");
    expect(previews).toContain("demoPlaceVideoTitle");
    expect(previews).not.toContain("PreviewCarHtml");
  });
});

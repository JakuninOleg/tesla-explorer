import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("PWA static assets", () => {
  it("ships brand mark and install icons on disk", () => {
    const required = [
      "public/brand/mark.png",
      "public/icons/icon-192.png",
      "public/icons/icon-512.png",
      "public/icons/icon-maskable-512.png",
      "src/app/icon.png",
      "src/app/apple-icon.png",
      "public/sw.js",
    ];

    for (const relative of required) {
      expect(existsSync(path.join(root, relative)), `missing ${relative}`).toBe(true);
    }
  });
});

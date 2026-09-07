import { describe, expect, it } from "vitest";
import Google from "next-auth/providers/google";

describe("auth providers", () => {
  it("uses Google as the only OAuth provider", () => {
    const provider = Google({
      clientId: "test-id",
      clientSecret: "test-secret",
    });

    expect(provider.id).toBe("google");
    expect(provider.type).toBe("oidc");
  });
});

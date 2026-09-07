import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { accounts, profiles, sessions, users } from "@/db/schema";

describe("db schema", () => {
  it("includes Auth.js core tables and profile", () => {
    expect(getTableName(users)).toBe("user");
    expect(getTableName(accounts)).toBe("account");
    expect(getTableName(sessions)).toBe("session");
    expect(getTableName(profiles)).toBe("profile");
  });
});

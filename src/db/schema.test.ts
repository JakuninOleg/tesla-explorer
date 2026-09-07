import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { accounts, profiles, routes, sessions, users } from "@/db/schema";

describe("db schema", () => {
  it("includes Auth.js core tables, profile, and route", () => {
    expect(getTableName(users)).toBe("user");
    expect(getTableName(accounts)).toBe("account");
    expect(getTableName(sessions)).toBe("session");
    expect(getTableName(profiles)).toBe("profile");
    expect(getTableName(routes)).toBe("route");
  });
});

import type { AdapterAccountType } from "@auth/core/adapters";
import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const profiles = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  homeAddress: text("homeAddress").notNull(),
  homeLat: doublePrecision("homeLat"),
  homeLng: doublePrecision("homeLng"),
  workAddress: text("workAddress").notNull(),
  workLat: doublePrecision("workLat"),
  workLng: doublePrecision("workLng"),
  household: text("household").$type<"solo" | "family">().notNull(),
  interests: text("interests").notNull(),
  teslaModel: text("teslaModel").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RouteStatus = "proposed" | "approved" | "declined";
export type StartAnchor = "home" | "work" | "other";

export const routes = pgTable("route", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  requestPrompt: text("requestPrompt").notNull(),
  availableHours: integer("availableHours").notNull(),
  batteryPercent: integer("batteryPercent").notNull(),
  startAnchor: text("startAnchor").$type<StartAnchor>().notNull(),
  startOtherText: text("startOtherText"),
  startOtherLat: doublePrecision("startOtherLat"),
  startOtherLng: doublePrecision("startOtherLng"),
  status: text("status").$type<RouteStatus>().notNull().default("proposed"),
  stopsJson: text("stopsJson").notNull(),
  summary: text("summary"),
  adjustNotes: text("adjustNotes"),
  rangeBudgetMiles: integer("rangeBudgetMiles"),
  rangeWarning: text("rangeWarning"),
  rating: integer("rating"),
  impressionNotes: text("impressionNotes"),
  preferenceNotes: text("preferenceNotes"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

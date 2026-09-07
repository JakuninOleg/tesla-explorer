import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

/**
 * Prefer real Neon URL. Placeholder keeps module import safe for CI/typecheck
 * when DATABASE_URL is unset — real queries still require a live database.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.AUTH_DRIZZLE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build";

export const db = drizzle(neon(databaseUrl), { schema });

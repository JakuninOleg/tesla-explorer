import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit does not load Next.js env files; prefer .env.local then .env.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.AUTH_DRIZZLE_URL ?? "",
  },
});

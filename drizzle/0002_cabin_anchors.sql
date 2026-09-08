-- Manual S4 migration (profile anchors + route status). Apply via Neon HTTP if drizzle-kit push hangs.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'homePlace'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'homeAddress'
  ) THEN
    ALTER TABLE "profile" RENAME COLUMN "homePlace" TO "homeAddress";
  END IF;
END $$;

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "homeLat" double precision;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "homeLng" double precision;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "workAddress" text;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "workLat" double precision;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "workLng" double precision;

UPDATE "profile" SET "workAddress" = '' WHERE "workAddress" IS NULL;
ALTER TABLE "profile" ALTER COLUMN "workAddress" SET NOT NULL;
ALTER TABLE "profile" ALTER COLUMN "workAddress" SET DEFAULT '';

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile' AND column_name = 'batteryPercent'
  ) THEN
    ALTER TABLE "profile" DROP COLUMN "batteryPercent";
  END IF;
END $$;

ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "startAnchor" text;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "startOtherText" text;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "startOtherLat" double precision;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "startOtherLng" double precision;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "adjustNotes" text;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "rangeBudgetMiles" integer;
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "rangeWarning" text;

UPDATE "route" SET "startAnchor" = 'home' WHERE "startAnchor" IS NULL;
UPDATE "route" SET "status" = 'approved' WHERE "status" IS NULL;

ALTER TABLE "route" ALTER COLUMN "startAnchor" SET NOT NULL;
ALTER TABLE "route" ALTER COLUMN "startAnchor" SET DEFAULT 'home';
ALTER TABLE "route" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "route" ALTER COLUMN "status" SET DEFAULT 'proposed';

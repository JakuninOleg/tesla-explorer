CREATE TABLE "route" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"requestPrompt" text NOT NULL,
	"availableHours" integer NOT NULL,
	"batteryPercent" integer NOT NULL,
	"stopsJson" text NOT NULL,
	"summary" text,
	"rating" integer,
	"impressionNotes" text,
	"preferenceNotes" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
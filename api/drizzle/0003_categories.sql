CREATE TYPE "public"."category_type" AS ENUM('expense', 'income', 'both');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"type" "category_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "category_id" uuid;--> statement-breakpoint
INSERT INTO "categories" ("user_id", "name", "icon", "color", "type", "sort_order", "is_active", "created_at", "updated_at")
SELECT DISTINCT ON ("user_id", "category")
	"user_id",
	"category",
	'Circle',
	'#94A3B8',
	'both'::"category_type",
	0,
	true,
	now(),
	now()
FROM "transactions"
WHERE trim("category") <> ''
ORDER BY "user_id", "category";--> statement-breakpoint
UPDATE "transactions" AS t
SET "category_id" = c."id"
FROM "categories" AS c
WHERE c."user_id" = t."user_id" AND c."name" = t."category";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "category";

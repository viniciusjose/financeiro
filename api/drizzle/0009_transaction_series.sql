CREATE TYPE "public"."transaction_series_kind" AS ENUM('installment', 'recurring');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "series_kind" "transaction_series_kind";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "series_index" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "series_total" integer;--> statement-breakpoint
CREATE INDEX "transactions_series_id_series_index_idx" ON "transactions" ("series_id","series_index");

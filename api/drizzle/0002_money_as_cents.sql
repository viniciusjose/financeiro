ALTER TABLE "bank_accounts" ALTER COLUMN "initial_balance" SET DATA TYPE integer USING (ROUND(CAST("initial_balance" AS numeric) * 100))::integer;--> statement-breakpoint
ALTER TABLE "bank_accounts" ALTER COLUMN "initial_balance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE integer USING (ROUND(CAST("amount" AS numeric) * 100))::integer;

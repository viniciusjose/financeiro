CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings', 'investment', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."bank_institution" AS ENUM('itau', 'sofisa', 'nubank', 'inter', 'other');--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bank" "bank_institution" NOT NULL,
	"bank_name" text,
	"type" "bank_account_type" NOT NULL,
	"initial_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"color" text,
	"last_four_digits" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
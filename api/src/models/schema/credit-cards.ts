import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bankAccounts } from "./bank-accounts.js";
import { users } from "./users.js";

export const creditCardBrandEnum = pgEnum("credit_card_brand", [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "diners",
  "other",
]);

export const creditCards = pgTable("credit_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  lastFourDigits: text("last_four_digits").notNull(),
  brand: creditCardBrandEnum("brand").notNull(),
  brandName: text("brand_name"),
  closingDay: integer("closing_day").notNull(),
  dueDay: integer("due_day").notNull(),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id, { onDelete: "restrict" }),
  creditLimitCents: integer("credit_limit_cents"),
  color: text("color"),
  isActive: boolean("is_active").notNull().default(true),
  isBlocked: boolean("is_blocked").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CreditCard = typeof creditCards.$inferSelect;
export type NewCreditCard = typeof creditCards.$inferInsert;

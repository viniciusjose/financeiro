import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const bankInstitutionEnum = pgEnum("bank_institution", [
  "itau",
  "sofisa",
  "nubank",
  "inter",
  "other",
]);

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "checking",
  "savings",
  "investment",
  "wallet",
]);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bank: bankInstitutionEnum("bank").notNull(),
  bankName: text("bank_name"),
  type: bankAccountTypeEnum("type").notNull(),
  initialBalance: integer("initial_balance").notNull().default(0),
  currency: text("currency").notNull().default("BRL"),
  color: text("color"),
  lastFourDigits: text("last_four_digits"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;

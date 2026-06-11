import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { creditCards } from "./credit-cards.js";
import { users } from "./users.js";

export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionSeriesKindEnum = pgEnum("transaction_series_kind", [
  "installment",
  "recurring",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    type: transactionTypeEnum("type").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, { onDelete: "restrict" }),
    seriesId: uuid("series_id"),
    seriesKind: transactionSeriesKindEnum("series_kind"),
    seriesIndex: integer("series_index"),
    seriesTotal: integer("series_total"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("transactions_series_id_series_index_idx").on(table.seriesId, table.seriesIndex)],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

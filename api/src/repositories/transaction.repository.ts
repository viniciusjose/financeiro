import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, inArray, isNotNull, sql, sum } from "drizzle-orm";
import { db } from "@/db/index.js";
import { formatDateInTimezone, getCurrentMonthStartDateString } from "@/lib/credit-card-billing.js";
import { bankAccounts } from "@/models/schema/bank-accounts.js";
import { categories } from "@/models/schema/categories.js";
import { creditCards } from "@/models/schema/credit-cards.js";
import {
  type NewTransaction,
  type Transaction,
  transactions,
} from "@/models/schema/transactions.js";

export interface ListTransactionsParams {
  userId: string;
  page: number;
  perPage: number;
}

export type TransactionWithCategory = Transaction & {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  creditCard: {
    id: string;
    name: string;
    lastFourDigits: string;
    brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
    brandName: string | null;
  } | null;
  bankAccount: {
    id: string;
    name: string;
    bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
    bankName: string | null;
  } | null;
};

export class TransactionRepository {
  async findById(id: string, userId: string): Promise<TransactionWithCategory | undefined> {
    const [row] = await db
      .select({
        transaction: transactions,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        },
        creditCard: {
          id: creditCards.id,
          name: creditCards.name,
          lastFourDigits: creditCards.lastFourDigits,
          brand: creditCards.brand,
          brandName: creditCards.brandName,
        },
        bankAccount: {
          id: bankAccounts.id,
          name: bankAccounts.name,
          bank: bankAccounts.bank,
          bankName: bankAccounts.bankName,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
      .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (!row) {
      return undefined;
    }

    return mapRow(row);
  }

  async list({ userId, page, perPage }: ListTransactionsParams) {
    const offset = (page - 1) * perPage;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          transaction: transactions,
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            color: categories.color,
          },
          creditCard: {
            id: creditCards.id,
            name: creditCards.name,
            lastFourDigits: creditCards.lastFourDigits,
            brand: creditCards.brand,
            brandName: creditCards.brandName,
          },
          bankAccount: {
            id: bankAccounts.id,
            name: bankAccounts.name,
            bank: bankAccounts.bank,
            bankName: bankAccounts.bankName,
          },
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
        .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(perPage)
        .offset(offset),
      db.select({ total: count() }).from(transactions).where(eq(transactions.userId, userId)),
    ]);

    return {
      items: rows.map(mapRow),
      total: totalResult[0]?.total ?? 0,
    };
  }

  async create(data: NewTransaction): Promise<TransactionWithCategory> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    const created = await this.findById(transaction.id, transaction.userId);

    if (!created) {
      throw new Error("Transação não encontrada");
    }

    return created;
  }

  async createMany(data: NewTransaction[]): Promise<TransactionWithCategory[]> {
    if (data.length === 0) {
      return [];
    }

    const userId = data[0]?.userId;

    if (!userId) {
      throw new Error("Usuário inválido");
    }

    return db.transaction(async (tx) => {
      const inserted = await tx.insert(transactions).values(data).returning();

      const rows = await tx
        .select({
          transaction: transactions,
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            color: categories.color,
          },
          creditCard: {
            id: creditCards.id,
            name: creditCards.name,
            lastFourDigits: creditCards.lastFourDigits,
            brand: creditCards.brand,
            brandName: creditCards.brandName,
          },
          bankAccount: {
            id: bankAccounts.id,
            name: bankAccounts.name,
            bank: bankAccounts.bank,
            bankName: bankAccounts.bankName,
          },
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
        .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
        .where(
          inArray(
            transactions.id,
            inserted.map((item) => item.id),
          ),
        )
        .orderBy(transactions.seriesIndex);

      return rows.map(mapRow);
    });
  }

  async listBySeriesId(seriesId: string, userId: string): Promise<TransactionWithCategory[]> {
    const rows = await db
      .select({
        transaction: transactions,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        },
        creditCard: {
          id: creditCards.id,
          name: creditCards.name,
          lastFourDigits: creditCards.lastFourDigits,
          brand: creditCards.brand,
          brandName: creditCards.brandName,
        },
        bankAccount: {
          id: bankAccounts.id,
          name: bankAccounts.name,
          bank: bankAccounts.bank,
          bankName: bankAccounts.bankName,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
      .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
      .where(and(eq(transactions.seriesId, seriesId), eq(transactions.userId, userId)))
      .orderBy(transactions.seriesIndex);

    return rows.map(mapRow);
  }

  async deleteFromSeriesIndex(
    seriesId: string,
    userId: string,
    fromIndex: number,
  ): Promise<number> {
    const result = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.seriesId, seriesId),
          eq(transactions.userId, userId),
          gte(transactions.seriesIndex, fromIndex),
        ),
      )
      .returning({ id: transactions.id });

    return result.length;
  }

  generateSeriesId() {
    return randomUUID();
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewTransaction, "id" | "userId">>,
  ): Promise<TransactionWithCategory | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!transaction) {
      return undefined;
    }

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    return result.length > 0;
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));

    return result?.total ?? 0;
  }

  async countByCreditCardId(creditCardId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.creditCardId, creditCardId));

    return result?.total ?? 0;
  }

  async listExpensesByCreditCardForCycle(
    userId: string,
    creditCardId: string,
    cycleStart: Date,
    cycleEnd: Date,
  ) {
    const rows = await db
      .select({
        transaction: transactions,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        },
        creditCard: {
          id: creditCards.id,
          name: creditCards.name,
          lastFourDigits: creditCards.lastFourDigits,
          brand: creditCards.brand,
          brandName: creditCards.brandName,
        },
        bankAccount: {
          id: bankAccounts.id,
          name: bankAccounts.name,
          bank: bankAccounts.bank,
          bankName: bankAccounts.bankName,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
      .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.creditCardId, creditCardId),
          eq(transactions.type, "expense"),
          gte(transactions.date, cycleStart),
          sql`timezone('America/Sao_Paulo', ${transactions.date})::date <= ${formatDateInTimezone(cycleEnd)}::date`,
        ),
      )
      .orderBy(desc(transactions.date));

    return rows.map(mapRow);
  }

  async sumExpensesByCreditCardForCycle(
    userId: string,
    creditCardId: string,
    cycleStart: Date,
    cycleEnd: Date,
  ) {
    const [result] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.creditCardId, creditCardId),
          eq(transactions.type, "expense"),
          gte(transactions.date, cycleStart),
          sql`timezone('America/Sao_Paulo', ${transactions.date})::date <= ${formatDateInTimezone(cycleEnd)}::date`,
        ),
      );

    return Number(result?.total ?? 0);
  }

  async listExpensesByCreditCardForCurrentCycle(
    userId: string,
    creditCardId: string,
    cycleStart: Date,
    cycleEnd: Date,
  ) {
    return this.listExpensesByCreditCardForCycle(userId, creditCardId, cycleStart, cycleEnd);
  }

  async sumExpensesByCreditCardForCurrentCycle(
    userId: string,
    creditCardId: string,
    cycleStart: Date,
    cycleEnd: Date,
  ) {
    return this.sumExpensesByCreditCardForCycle(userId, creditCardId, cycleStart, cycleEnd);
  }

  async sumExpensesByCreditCardFromCurrentMonthOnward(userId: string, creditCardId: string) {
    const currentMonthStart = getCurrentMonthStartDateString();

    const [result] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.creditCardId, creditCardId),
          eq(transactions.type, "expense"),
          sql`timezone('America/Sao_Paulo', ${transactions.date})::date >= ${currentMonthStart}::date`,
        ),
      );

    return Number(result?.total ?? 0);
  }

  async sumExpensesByCreditCardsFromCurrentMonthOnward(userId: string, creditCardIds: string[]) {
    if (creditCardIds.length === 0) {
      return new Map<string, number>();
    }

    const currentMonthStart = getCurrentMonthStartDateString();

    const rows = await db
      .select({
        creditCardId: transactions.creditCardId,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          inArray(transactions.creditCardId, creditCardIds),
          isNotNull(transactions.creditCardId),
          sql`timezone('America/Sao_Paulo', ${transactions.date})::date >= ${currentMonthStart}::date`,
        ),
      )
      .groupBy(transactions.creditCardId);

    return new Map(
      rows
        .filter((row) => row.creditCardId != null)
        .map((row) => [row.creditCardId as string, Number(row.total ?? 0)]),
    );
  }

  async sumExpensesByCreditCardsForCurrentCycles(
    userId: string,
    cycles: Array<{ creditCardId: string; cycleStart: Date; cycleEnd: Date }>,
  ) {
    if (cycles.length === 0) {
      return new Map<string, number>();
    }

    const results = await Promise.all(
      cycles.map(async ({ creditCardId, cycleStart, cycleEnd }) => {
        const total = await this.sumExpensesByCreditCardForCurrentCycle(
          userId,
          creditCardId,
          cycleStart,
          cycleEnd,
        );
        return [creditCardId, total] as const;
      }),
    );

    return new Map(results);
  }

  async sumExpensesByCategoryIdsForCurrentMonth(userId: string, categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          inArray(transactions.categoryId, categoryIds),
          isNotNull(transactions.categoryId),
          sql`${transactions.date} >= date_trunc('month', timezone('America/Sao_Paulo', now()))`,
          sql`${transactions.date} < date_trunc('month', timezone('America/Sao_Paulo', now())) + interval '1 month'`,
        ),
      )
      .groupBy(transactions.categoryId);

    return new Map(
      rows
        .filter((row) => row.categoryId != null)
        .map((row) => [row.categoryId as string, Number(row.total ?? 0)]),
    );
  }
}

function mapRow(row: {
  transaction: Transaction;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  creditCard: {
    id: string;
    name: string;
    lastFourDigits: string;
    brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
    brandName: string | null;
  } | null;
  bankAccount: {
    id: string;
    name: string;
    bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
    bankName: string | null;
  } | null;
}): TransactionWithCategory {
  return {
    ...row.transaction,
    category: row.category?.id ? row.category : null,
    creditCard: row.creditCard?.id ? row.creditCard : null,
    bankAccount: row.bankAccount?.id ? row.bankAccount : null,
  };
}

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
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

export class TransactionRepository {
  async findById(id: string, userId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    return transaction;
  }

  async list({ userId, page, perPage }: ListTransactionsParams) {
    const offset = (page - 1) * perPage;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(perPage)
        .offset(offset),
      db.select({ total: count() }).from(transactions).where(eq(transactions.userId, userId)),
    ]);

    return {
      items,
      total: totalResult[0]?.total ?? 0,
    };
  }

  async create(data: NewTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewTransaction, "id" | "userId">>,
  ): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return transaction;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    return result.length > 0;
  }
}

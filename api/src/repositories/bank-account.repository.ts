import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  type BankAccount,
  bankAccounts,
  type NewBankAccount,
} from "@/models/schema/bank-accounts.js";

export interface ListBankAccountsParams {
  userId: string;
  includeInactive: boolean;
}

export class BankAccountRepository {
  async findById(id: string, userId: string): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .limit(1);

    return account;
  }

  async list({ userId, includeInactive }: ListBankAccountsParams): Promise<BankAccount[]> {
    const conditions = includeInactive
      ? eq(bankAccounts.userId, userId)
      : and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true));

    return db
      .select()
      .from(bankAccounts)
      .where(conditions)
      .orderBy(desc(bankAccounts.isDefault), desc(bankAccounts.createdAt));
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId));

    return result?.total ?? 0;
  }

  async create(data: NewBankAccount): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values(data).returning();
    return account;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewBankAccount, "id" | "userId">>,
  ): Promise<BankAccount | undefined> {
    const [account] = await db
      .update(bankAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .returning();

    return account;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .returning({ id: bankAccounts.id });

    return result.length > 0;
  }

  async clearDefaultForUser(userId: string, exceptId?: string): Promise<void> {
    const accounts = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isDefault, true)));

    for (const account of accounts) {
      if (exceptId && account.id === exceptId) {
        continue;
      }

      await db
        .update(bankAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(bankAccounts.id, account.id));
    }
  }
}

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { bankAccounts } from "@/models/schema/bank-accounts.js";
import { type CreditCard, creditCards, type NewCreditCard } from "@/models/schema/credit-cards.js";

export interface ListCreditCardsParams {
  userId: string;
  includeInactive: boolean;
}

export interface CreditCardWithBankAccount {
  creditCard: CreditCard;
  bankAccount: {
    id: string;
    name: string;
    bank: "itau" | "sofisa" | "nubank" | "inter" | "other";
    bankName: string | null;
    isActive: boolean;
  };
}

export class CreditCardRepository {
  async findById(id: string, userId: string): Promise<CreditCard | undefined> {
    const [card] = await db
      .select()
      .from(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .limit(1);

    return card;
  }

  async findByIdWithBankAccount(
    id: string,
    userId: string,
  ): Promise<CreditCardWithBankAccount | undefined> {
    const [row] = await db
      .select({
        creditCard: creditCards,
        bankAccount: {
          id: bankAccounts.id,
          name: bankAccounts.name,
          bank: bankAccounts.bank,
          bankName: bankAccounts.bankName,
          isActive: bankAccounts.isActive,
        },
      })
      .from(creditCards)
      .innerJoin(bankAccounts, eq(creditCards.bankAccountId, bankAccounts.id))
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .limit(1);

    return row;
  }

  async list({
    userId,
    includeInactive,
  }: ListCreditCardsParams): Promise<CreditCardWithBankAccount[]> {
    const conditions = includeInactive
      ? eq(creditCards.userId, userId)
      : and(eq(creditCards.userId, userId), eq(creditCards.isActive, true));

    return db
      .select({
        creditCard: creditCards,
        bankAccount: {
          id: bankAccounts.id,
          name: bankAccounts.name,
          bank: bankAccounts.bank,
          bankName: bankAccounts.bankName,
          isActive: bankAccounts.isActive,
        },
      })
      .from(creditCards)
      .innerJoin(bankAccounts, eq(creditCards.bankAccountId, bankAccounts.id))
      .where(conditions)
      .orderBy(desc(creditCards.createdAt));
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(creditCards)
      .where(eq(creditCards.userId, userId));

    return result?.total ?? 0;
  }

  async countByBankAccountId(bankAccountId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(creditCards)
      .where(eq(creditCards.bankAccountId, bankAccountId));

    return result?.total ?? 0;
  }

  async create(data: NewCreditCard): Promise<CreditCard> {
    const [card] = await db.insert(creditCards).values(data).returning();
    return card;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewCreditCard, "id" | "userId">>,
  ): Promise<CreditCard | undefined> {
    const [card] = await db
      .update(creditCards)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    return card;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning({ id: creditCards.id });

    return result.length > 0;
  }
}

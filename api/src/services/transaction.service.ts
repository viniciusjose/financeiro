import type { TransactionRepository } from "@/repositories/transaction.repository.js";
import type { CategoryService } from "@/services/category.service.js";
import type { CreditCardService } from "@/services/credit-card.service.js";

export interface CreateTransactionInput {
  userId: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId?: string | null;
  creditCardId?: string | null;
  date: Date;
}

export interface UpdateTransactionInput {
  id: string;
  userId: string;
  description?: string;
  amount?: number;
  type?: "income" | "expense";
  categoryId?: string | null;
  creditCardId?: string | null;
  date?: Date;
}

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryService: CategoryService,
    private readonly creditCardService: CreditCardService,
  ) {}

  async list(userId: string, page: number, perPage: number) {
    const { items, total } = await this.transactionRepository.list({
      userId,
      page,
      perPage,
    });

    return {
      items: items.map(serializeTransaction),
      total,
      page,
      perPage,
    };
  }

  async getById(id: string, userId: string) {
    const transaction = await this.transactionRepository.findById(id, userId);

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    return serializeTransaction(transaction);
  }

  async create(input: CreateTransactionInput) {
    const categoryId = await this.resolveCategoryId(input.categoryId, input.userId, input.type);
    const creditCardId = await this.resolveCreditCardId(
      input.creditCardId,
      input.userId,
      input.type,
    );

    const transaction = await this.transactionRepository.create({
      userId: input.userId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      categoryId,
      creditCardId,
      date: input.date,
    });

    return serializeTransaction(transaction);
  }

  async update(input: UpdateTransactionInput) {
    const existing = await this.transactionRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new Error("Transação não encontrada");
    }

    const nextType = input.type ?? existing.type;
    const categoryId =
      input.categoryId !== undefined
        ? await this.resolveCategoryId(input.categoryId, input.userId, nextType)
        : undefined;
    const creditCardId =
      input.creditCardId !== undefined || input.type !== undefined
        ? await this.resolveCreditCardId(
            input.creditCardId !== undefined ? input.creditCardId : existing.creditCardId,
            input.userId,
            nextType,
          )
        : undefined;

    const transaction = await this.transactionRepository.update(input.id, input.userId, {
      description: input.description,
      amount: input.amount,
      type: input.type,
      categoryId,
      creditCardId,
      date: input.date,
    });

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    return serializeTransaction(transaction);
  }

  async delete(id: string, userId: string) {
    const deleted = await this.transactionRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Transação não encontrada");
    }
  }

  private async resolveCategoryId(
    categoryId: string | null | undefined,
    userId: string,
    transactionType: "income" | "expense",
  ) {
    if (categoryId === undefined || categoryId === null) {
      return null;
    }

    await this.categoryService.validateCategoryForTransaction(categoryId, userId, transactionType);
    return categoryId;
  }

  private async resolveCreditCardId(
    creditCardId: string | null | undefined,
    userId: string,
    transactionType: "income" | "expense",
  ) {
    if (transactionType !== "expense") {
      return null;
    }

    if (creditCardId === undefined || creditCardId === null) {
      return null;
    }

    await this.creditCardService.assertCanReceiveTransactions(creditCardId, userId);
    return creditCardId;
  }
}

function serializeTransaction(transaction: {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string | null;
  creditCardId: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  creditCard?: {
    id: string;
    name: string;
    lastFourDigits: string;
    brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
    brandName: string | null;
  } | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    categoryId: transaction.categoryId,
    creditCardId: transaction.creditCardId,
    category: transaction.category?.id
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          icon: transaction.category.icon,
          color: transaction.category.color,
        }
      : undefined,
    creditCard: transaction.creditCard?.id
      ? {
          id: transaction.creditCard.id,
          name: transaction.creditCard.name,
          lastFourDigits: transaction.creditCard.lastFourDigits,
          brand: transaction.creditCard.brand,
          brandName: transaction.creditCard.brandName,
        }
      : undefined,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

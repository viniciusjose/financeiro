import {
  addMonths,
  type ApplyScope,
  buildSeriesAmounts,
  buildSeriesDates,
  type SeriesKind,
} from "@/lib/transaction-series.js";
import type { TransactionRepository } from "@/repositories/transaction.repository.js";
import type { CategoryService } from "@/services/category.service.js";
import type { CreditCardService } from "@/services/credit-card.service.js";

export interface RecurrenceInput {
  kind: SeriesKind;
  totalOccurrences: number;
}

export interface CreateTransactionInput {
  userId: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId?: string | null;
  creditCardId?: string | null;
  date: Date;
  recurrence?: RecurrenceInput;
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
  applyScope?: ApplyScope;
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

    if (!input.recurrence) {
      const transaction = await this.transactionRepository.create({
        userId: input.userId,
        description: input.description,
        amount: input.amount,
        type: input.type,
        categoryId,
        creditCardId,
        date: input.date,
        seriesId: null,
        seriesKind: null,
        seriesIndex: null,
        seriesTotal: null,
      });

      return serializeTransaction(transaction);
    }

    const { kind, totalOccurrences } = input.recurrence;
    const seriesId = this.transactionRepository.generateSeriesId();
    const amounts = buildSeriesAmounts(kind, input.amount, totalOccurrences);
    const dates = buildSeriesDates(input.date, totalOccurrences);

    const rows = dates.map((date, index) => ({
      userId: input.userId,
      description: input.description,
      amount: amounts[index],
      type: input.type,
      categoryId,
      creditCardId,
      seriesId,
      seriesKind: kind,
      seriesIndex: index + 1,
      seriesTotal: totalOccurrences,
      date,
    }));

    const created = await this.transactionRepository.createMany(rows);

    return {
      items: created.map(serializeTransaction),
    };
  }

  async update(input: UpdateTransactionInput) {
    const existing = await this.transactionRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new Error("Transação não encontrada");
    }

    const applyScope = input.applyScope ?? "only_this";
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

    if (
      applyScope === "this_and_future" &&
      existing.seriesId &&
      existing.seriesIndex != null
    ) {
      const siblings = await this.transactionRepository.listBySeriesId(
        existing.seriesId,
        input.userId,
      );
      const currentIndex = existing.seriesIndex ?? 0;
      const future = siblings.filter(
        (item) => item.seriesIndex != null && item.seriesIndex >= currentIndex,
      );

      let lastUpdated = existing;

      for (const sibling of future) {
        const offset =
          sibling.seriesIndex != null ? sibling.seriesIndex - currentIndex : 0;
        const nextDate =
          input.date !== undefined ? addMonths(input.date, offset) : sibling.date;

        const updated = await this.transactionRepository.update(sibling.id, input.userId, {
          description: input.description,
          amount: input.amount,
          type: input.type,
          categoryId,
          creditCardId,
          date: nextDate,
        });

        if (updated) {
          lastUpdated = updated;
        }
      }

      return serializeTransaction(lastUpdated);
    }

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

  async delete(id: string, userId: string, applyScope: ApplyScope = "only_this") {
    const existing = await this.transactionRepository.findById(id, userId);

    if (!existing) {
      throw new Error("Transação não encontrada");
    }

    if (
      applyScope === "this_and_future" &&
      existing.seriesId &&
      existing.seriesIndex != null
    ) {
      const removed = await this.transactionRepository.deleteFromSeriesIndex(
        existing.seriesId,
        userId,
        existing.seriesIndex,
      );

      if (removed === 0) {
        throw new Error("Transação não encontrada");
      }

      return;
    }

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
  seriesId: string | null;
  seriesKind: "installment" | "recurring" | null;
  seriesIndex: number | null;
  seriesTotal: number | null;
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
    seriesId: transaction.seriesId,
    seriesKind: transaction.seriesKind,
    seriesIndex: transaction.seriesIndex,
    seriesTotal: transaction.seriesTotal,
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

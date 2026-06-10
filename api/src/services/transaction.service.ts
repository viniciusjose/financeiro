import type { TransactionRepository } from "@/repositories/transaction.repository.js";

export interface CreateTransactionInput {
  userId: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  date: Date;
}

export interface UpdateTransactionInput {
  id: string;
  userId: string;
  description?: string;
  amount?: string;
  type?: "income" | "expense";
  category?: string;
  date?: Date;
}

export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async list(userId: string, page: number, perPage: number) {
    const { items, total } = await this.transactionRepository.list({
      userId,
      page,
      perPage,
    });

    return {
      items,
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

    return transaction;
  }

  async create(input: CreateTransactionInput) {
    if (Number(input.amount) <= 0) {
      throw new Error("O valor deve ser maior que zero");
    }

    return this.transactionRepository.create({
      userId: input.userId,
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
    });
  }

  async update(input: UpdateTransactionInput) {
    if (input.amount && Number(input.amount) <= 0) {
      throw new Error("O valor deve ser maior que zero");
    }

    const transaction = await this.transactionRepository.update(input.id, input.userId, {
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
    });

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    return transaction;
  }

  async delete(id: string, userId: string) {
    const deleted = await this.transactionRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Transação não encontrada");
    }
  }
}

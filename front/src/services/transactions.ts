import { api } from "@/lib/api";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/schemas/transaction.schema";
import { toApiCreatePayload, toApiUpdatePayload } from "@/schemas/transaction.schema";

export interface TransactionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface TransactionCreditCard {
  id: string;
  name: string;
  lastFourDigits: string;
  brand: "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";
  brandName: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string | null;
  creditCardId: string | null;
  category?: TransactionCategory;
  creditCard?: TransactionCreditCard;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface ListTransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  perPage: number;
}

export const transactionsService = {
  async list(options?: { page?: number; perPage?: number }) {
    const params = new URLSearchParams();

    if (options?.page) {
      params.set("page", String(options.page));
    }

    if (options?.perPage) {
      params.set("perPage", String(options.perPage));
    }

    const query = params.toString();
    const path = query ? `/api/transactions?${query}` : "/api/transactions";
    return api.get<ListTransactionsResponse>(path);
  },

  async getById(id: string) {
    return api.get<Transaction>(`/api/transactions/${id}`);
  },

  async create(input: CreateTransactionInput) {
    return api.post<Transaction>("/api/transactions", toApiCreatePayload(input));
  },

  async update(id: string, input: UpdateTransactionInput) {
    return api.put<Transaction>(`/api/transactions/${id}`, toApiUpdatePayload(input));
  },

  async delete(id: string) {
    await api.delete<null>(`/api/transactions/${id}`);
  },
};

import { api } from "@/lib/api";
import type { BankInstitution } from "@/lib/bank-logos";
import type {
  ApplyScope,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/schemas/transaction.schema";
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

export interface TransactionBankAccount {
  id: string;
  name: string;
  bank: BankInstitution;
  bankName: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string | null;
  creditCardId: string | null;
  bankAccountId: string | null;
  seriesId: string | null;
  seriesKind: "installment" | "recurring" | null;
  seriesIndex: number | null;
  seriesTotal: number | null;
  category?: TransactionCategory;
  creditCard?: TransactionCreditCard;
  bankAccount?: TransactionBankAccount;
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

interface CreateSeriesResponse {
  items: Transaction[];
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
    const payload = toApiCreatePayload(input);

    if (payload.recurrence) {
      return api.post<CreateSeriesResponse>("/api/transactions", payload);
    }

    return api.post<Transaction>("/api/transactions", payload);
  },

  async update(id: string, input: UpdateTransactionInput, applyScope?: ApplyScope) {
    return api.put<Transaction>(`/api/transactions/${id}`, toApiUpdatePayload(input, applyScope));
  },

  async delete(id: string, applyScope?: ApplyScope) {
    const params = new URLSearchParams();

    if (applyScope) {
      params.set("applyScope", applyScope);
    }

    const query = params.toString();
    const path = query ? `/api/transactions/${id}?${query}` : `/api/transactions/${id}`;
    await api.delete<null>(path);
  },
};

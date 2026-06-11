import { api } from "@/lib/api";
import type { BankInstitution } from "@/lib/bank-logos";
import type { CreditCardBrand } from "@/lib/card-brands";
import type { CreateCreditCardInput, UpdateCreditCardInput } from "@/schemas/credit-card.schema";
import { toApiCreatePayload, toApiUpdatePayload } from "@/schemas/credit-card.schema";

export interface CreditCardBankAccount {
  id: string;
  name: string;
  bank: BankInstitution;
  bankName: string | null;
  isActive: boolean;
}

export interface CreditCardBillTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface CreditCardBill {
  creditCard: CreditCard;
  cycleStart: string;
  cycleEnd: string;
  isCurrentOpenCycle: boolean;
  totalSpentCents: number;
  transactions: CreditCardBillTransaction[];
}

export interface CreditCard {
  id: string;
  name: string;
  lastFourDigits: string;
  brand: CreditCardBrand;
  brandName: string | null;
  closingDay: number;
  dueDay: number;
  bankAccountId: string;
  creditLimitCents: number | null;
  currentBillSpentCents: number;
  limitUsedCents: number;
  bankAccount: CreditCardBankAccount;
  isActive: boolean;
  isBlocked: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListCreditCardsResponse {
  creditCards: CreditCard[];
}

interface CreditCardResponse {
  creditCard: CreditCard;
}

export const creditCardsService = {
  async list(options?: { includeInactive?: boolean }) {
    const params = new URLSearchParams();

    if (options?.includeInactive) {
      params.set("includeInactive", "true");
    }

    const query = params.toString();
    const path = query ? `/api/credit-cards?${query}` : "/api/credit-cards";
    const data = await api.get<ListCreditCardsResponse>(path);
    return data.creditCards;
  },

  async getById(id: string) {
    const data = await api.get<CreditCardResponse>(`/api/credit-cards/${id}`);
    return data.creditCard;
  },

  async getBill(id: string, options?: { referenceDate?: string }) {
    const params = new URLSearchParams();

    if (options?.referenceDate) {
      params.set("referenceDate", options.referenceDate);
    }

    const query = params.toString();
    const path = query
      ? `/api/credit-cards/${id}/bill?${query}`
      : `/api/credit-cards/${id}/bill`;
    const data = await api.get<{ bill: CreditCardBill }>(path);
    return data.bill;
  },

  async create(input: CreateCreditCardInput) {
    const data = await api.post<CreditCardResponse>("/api/credit-cards", toApiCreatePayload(input));
    return data.creditCard;
  },

  async update(id: string, input: UpdateCreditCardInput) {
    const data = await api.put<CreditCardResponse>(
      `/api/credit-cards/${id}`,
      toApiUpdatePayload(input),
    );
    return data.creditCard;
  },

  async delete(id: string) {
    await api.delete<null>(`/api/credit-cards/${id}`);
  },
};

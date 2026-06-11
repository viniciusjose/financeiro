import { api } from "@/lib/api";
import type { BankAccountType, BankInstitution } from "@/lib/bank-logos";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "@/schemas/bank-account.schema";
import { toApiCreatePayload, toApiUpdatePayload } from "@/schemas/bank-account.schema";

export interface BankAccount {
  id: string;
  name: string;
  bank: BankInstitution;
  bankName: string | null;
  type: BankAccountType;
  initialBalance: number;
  currency: "BRL";
  color: string | null;
  lastFourDigits: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListBankAccountsResponse {
  accounts: BankAccount[];
}

interface BankAccountResponse {
  account: BankAccount;
}

export const bankAccountsService = {
  async list(options?: { includeInactive?: boolean }) {
    const params = new URLSearchParams();

    if (options?.includeInactive) {
      params.set("includeInactive", "true");
    }

    const query = params.toString();
    const path = query ? `/api/bank-accounts?${query}` : "/api/bank-accounts";
    const data = await api.get<ListBankAccountsResponse>(path);
    return data.accounts;
  },

  async getById(id: string) {
    const data = await api.get<BankAccountResponse>(`/api/bank-accounts/${id}`);
    return data.account;
  },

  async create(input: CreateBankAccountInput) {
    const data = await api.post<BankAccountResponse>(
      "/api/bank-accounts",
      toApiCreatePayload(input),
    );
    return data.account;
  },

  async update(id: string, input: UpdateBankAccountInput) {
    const data = await api.put<BankAccountResponse>(
      `/api/bank-accounts/${id}`,
      toApiUpdatePayload(input),
    );
    return data.account;
  },

  async delete(id: string) {
    await api.delete<null>(`/api/bank-accounts/${id}`);
  },
};

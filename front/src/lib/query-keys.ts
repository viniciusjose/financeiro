import type { Category } from "@/services/categories";

export const queryKeys = {
  categories: {
    all: ["categories"] as const,
    list: (filters?: { includeInactive?: boolean; type?: Category["type"] }) =>
      ["categories", "list", filters] as const,
  },
  bankAccounts: {
    all: ["bankAccounts"] as const,
    list: (filters?: { includeInactive?: boolean }) => ["bankAccounts", "list", filters] as const,
  },
  creditCards: {
    all: ["creditCards"] as const,
    list: (filters?: { includeInactive?: boolean }) => ["creditCards", "list", filters] as const,
    bill: (id: string, referenceDate: string) => ["creditCards", "bill", id, referenceDate] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters?: { page?: number; perPage?: number }) =>
      ["transactions", "list", filters] as const,
  },
} as const;

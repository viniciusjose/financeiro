import { useCallback, useEffect, useState } from "react";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "@/schemas/bank-account.schema";
import { type BankAccount, bankAccountsService } from "@/services/bank-accounts";

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bankAccountsService.list({ includeInactive });
      setAccounts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar contas.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createAccount = useCallback(
    async (input: CreateBankAccountInput) => {
      await bankAccountsService.create(input);
      await refresh();
    },
    [refresh],
  );

  const updateAccount = useCallback(
    async (id: string, input: UpdateBankAccountInput) => {
      await bankAccountsService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await bankAccountsService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    accounts,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

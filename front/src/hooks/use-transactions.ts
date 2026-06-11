import { useCallback, useEffect, useState } from "react";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/schemas/transaction.schema";
import { type Transaction, transactionsService } from "@/services/transactions";

export function useTransactions(page = 1, perPage = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await transactionsService.list({ page, perPage });
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar transações.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      await transactionsService.create(input);
      await refresh();
    },
    [refresh],
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput) => {
      await transactionsService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await transactionsService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    transactions,
    total,
    isLoading,
    error,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getQueryErrorMessage } from "@/lib/query-error";
import { queryKeys } from "@/lib/query-keys";
import type { ApplyScope, CreateTransactionInput, UpdateTransactionInput } from "@/schemas/transaction.schema";
import { transactionsService } from "@/services/transactions";

export function useTransactions(page = 1, perPage = 10) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.transactions.list({ page, perPage }),
    queryFn: () => transactionsService.list({ page, perPage }),
  });

  const invalidateRelatedQueries = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    ]);
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionsService.create(input),
    onSuccess: invalidateRelatedQueries,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
      applyScope,
    }: {
      id: string;
      input: UpdateTransactionInput;
      applyScope?: ApplyScope;
    }) => transactionsService.update(id, input, applyScope),
    onSuccess: invalidateRelatedQueries,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, applyScope }: { id: string; applyScope?: ApplyScope }) =>
      transactionsService.delete(id, applyScope),
    onSuccess: invalidateRelatedQueries,
  });

  const createTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      await createMutation.mutateAsync(input);
    },
    [createMutation],
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput, applyScope?: ApplyScope) => {
      await updateMutation.mutateAsync({ id, input, applyScope });
    },
    [updateMutation],
  );

  const deleteTransaction = useCallback(
    async (id: string, applyScope?: ApplyScope) => {
      await deleteMutation.mutateAsync({ id, applyScope });
    },
    [deleteMutation],
  );

  return {
    transactions: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: getQueryErrorMessage(error, "Erro ao carregar transações."),
    refresh: refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

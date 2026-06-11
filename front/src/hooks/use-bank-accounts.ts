import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getQueryErrorMessage } from "@/lib/query-error";
import { queryKeys } from "@/lib/query-keys";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "@/schemas/bank-account.schema";
import { bankAccountsService } from "@/services/bank-accounts";

export function useBankAccounts() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bankAccounts.list({ includeInactive }),
    queryFn: () => bankAccountsService.list({ includeInactive }),
  });

  const invalidateBankAccounts = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateBankAccountInput) => bankAccountsService.create(input),
    onSuccess: invalidateBankAccounts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBankAccountInput }) =>
      bankAccountsService.update(id, input),
    onSuccess: invalidateBankAccounts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bankAccountsService.delete(id),
    onSuccess: invalidateBankAccounts,
  });

  const createAccount = useCallback(
    async (input: CreateBankAccountInput) => {
      await createMutation.mutateAsync(input);
    },
    [createMutation],
  );

  const updateAccount = useCallback(
    async (id: string, input: UpdateBankAccountInput) => {
      await updateMutation.mutateAsync({ id, input });
    },
    [updateMutation],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    accounts,
    isLoading,
    error: getQueryErrorMessage(error, "Erro ao carregar contas."),
    includeInactive,
    setIncludeInactive,
    refresh: refetch,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

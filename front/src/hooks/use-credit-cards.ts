import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getQueryErrorMessage } from "@/lib/query-error";
import { queryKeys } from "@/lib/query-keys";
import type { CreateCreditCardInput, UpdateCreditCardInput } from "@/schemas/credit-card.schema";
import { creditCardsService } from "@/services/credit-cards";

export function useCreditCards() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: creditCards = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.creditCards.list({ includeInactive }),
    queryFn: () => creditCardsService.list({ includeInactive }),
  });

  const invalidateCreditCards = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateCreditCardInput) => creditCardsService.create(input),
    onSuccess: invalidateCreditCards,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCreditCardInput }) =>
      creditCardsService.update(id, input),
    onSuccess: invalidateCreditCards,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditCardsService.delete(id),
    onSuccess: invalidateCreditCards,
  });

  const createCreditCard = useCallback(
    async (input: CreateCreditCardInput) => {
      await createMutation.mutateAsync(input);
    },
    [createMutation],
  );

  const updateCreditCard = useCallback(
    async (id: string, input: UpdateCreditCardInput) => {
      await updateMutation.mutateAsync({ id, input });
    },
    [updateMutation],
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    creditCards,
    isLoading,
    error: getQueryErrorMessage(error, "Erro ao carregar cartões."),
    includeInactive,
    setIncludeInactive,
    refresh: refetch,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
  };
}

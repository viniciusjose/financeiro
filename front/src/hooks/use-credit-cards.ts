import { useCallback, useEffect, useState } from "react";
import type { CreateCreditCardInput, UpdateCreditCardInput } from "@/schemas/credit-card.schema";
import { type CreditCard, creditCardsService } from "@/services/credit-cards";

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await creditCardsService.list({ includeInactive });
      setCreditCards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar cartões.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCreditCard = useCallback(
    async (input: CreateCreditCardInput) => {
      await creditCardsService.create(input);
      await refresh();
    },
    [refresh],
  );

  const updateCreditCard = useCallback(
    async (id: string, input: UpdateCreditCardInput) => {
      await creditCardsService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      await creditCardsService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    creditCards,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
  };
}

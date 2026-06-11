import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getQueryErrorMessage } from "@/lib/query-error";
import { queryKeys } from "@/lib/query-keys";
import { creditCardsService } from "@/services/credit-cards";

function toReferenceDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-15`;
}

export function useCreditCardBill(creditCardId: string | undefined, referenceDate: Date) {
  const referenceDateParam = toReferenceDateParam(referenceDate);

  const { data: bill, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.creditCards.bill(creditCardId ?? "", referenceDateParam),
    queryFn: () => {
      if (!creditCardId) {
        throw new Error("Cartão inválido.");
      }

      return creditCardsService.getBill(creditCardId, { referenceDate: referenceDateParam });
    },
    enabled: Boolean(creditCardId),
    placeholderData: keepPreviousData,
  });

  return {
    bill,
    isLoading: isPending && bill === undefined,
    isBillLoading: isFetching,
    error: getQueryErrorMessage(error, "Erro ao carregar fatura."),
    refresh: refetch,
  };
}

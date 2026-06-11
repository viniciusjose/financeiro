import type { CreditCard } from "@/services/credit-cards";

export function canAddTransactionsToCreditCard(
  creditCard: Pick<CreditCard, "isActive" | "isBlocked">,
): boolean {
  return creditCard.isActive && !creditCard.isBlocked;
}

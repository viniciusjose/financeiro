import type { CreditCard } from "@/services/credit-cards";

export function getCreditCardLimitUsedCents(creditCard: Pick<CreditCard, "limitUsedCents" | "currentBillSpentCents">) {
  return creditCard.limitUsedCents ?? creditCard.currentBillSpentCents;
}

export function getCreditLimitUsedPercent(spentCents: number, limitCents: number) {
  if (limitCents <= 0) {
    return 0;
  }

  return Math.round((spentCents / limitCents) * 100);
}

export function formatCreditLimitUsedPercent(spentCents: number, limitCents: number) {
  return `${getCreditLimitUsedPercent(spentCents, limitCents)}%`;
}

export function getAvailableLimitCents(limitCents: number, spentCents: number) {
  return Math.max(limitCents - spentCents, 0);
}

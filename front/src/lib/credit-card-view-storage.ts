export type CreditCardViewMode = "list" | "grid";

const CREDIT_CARD_VIEW_MODE_KEY = "creditCardViewMode";

export function getCreditCardViewMode(defaultMode: CreditCardViewMode = "grid"): CreditCardViewMode {
  if (typeof localStorage === "undefined") {
    return defaultMode;
  }

  const stored = localStorage.getItem(CREDIT_CARD_VIEW_MODE_KEY);

  if (stored === "list" || stored === "grid") {
    return stored;
  }

  return defaultMode;
}

export function setCreditCardViewMode(mode: CreditCardViewMode): void {
  localStorage.setItem(CREDIT_CARD_VIEW_MODE_KEY, mode);
}

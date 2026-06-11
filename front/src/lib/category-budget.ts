export function getBudgetUsedPercent(monthSpentCents: number, spendingLimitCents: number) {
  if (spendingLimitCents <= 0) {
    return 0;
  }

  return Math.round((monthSpentCents / spendingLimitCents) * 100);
}

export function formatBudgetUsedPercent(monthSpentCents: number, spendingLimitCents: number) {
  return `${getBudgetUsedPercent(monthSpentCents, spendingLimitCents)}%`;
}

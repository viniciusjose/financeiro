const MIN_SERIES_OCCURRENCES = 2;
const MAX_SERIES_OCCURRENCES = 48;

export type SeriesKind = "installment" | "recurring";
export type ApplyScope = "only_this" | "this_and_future";

export function validateSeriesOccurrences(count: number) {
  if (!Number.isInteger(count) || count < MIN_SERIES_OCCURRENCES || count > MAX_SERIES_OCCURRENCES) {
    throw new Error(`Quantidade deve ser entre ${MIN_SERIES_OCCURRENCES} e ${MAX_SERIES_OCCURRENCES}`);
  }
}

export function splitInstallmentAmounts(totalCents: number, count: number): number[] {
  validateSeriesOccurrences(count);

  const baseAmount = Math.floor(totalCents / count);
  const amounts = Array.from({ length: count }, () => baseAmount);
  amounts[count - 1] = totalCents - baseAmount * (count - 1);

  return amounts;
}

/** Avança N meses no calendário local; ajusta para último dia se o dia não existir no mês alvo. */
export function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = date.getDate();
  const result = new Date(year, month, day);

  if (result.getDate() !== day) {
    return new Date(year, month + 1, 0);
  }

  return result;
}

export function buildSeriesDates(startDate: Date, count: number): Date[] {
  validateSeriesOccurrences(count);

  return Array.from({ length: count }, (_, index) => addMonths(startDate, index));
}

export function buildSeriesAmounts(
  kind: SeriesKind,
  totalOrMonthlyCents: number,
  count: number,
): number[] {
  if (kind === "installment") {
    return splitInstallmentAmounts(totalOrMonthlyCents, count);
  }

  validateSeriesOccurrences(count);
  return Array.from({ length: count }, () => totalOrMonthlyCents);
}

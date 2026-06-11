const TIMEZONE = "America/Sao_Paulo";

export function getDatePartsInTimezone(date: Date, timeZone = TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);

  return { year, month, day };
}

export function getEffectiveClosingDay(year: number, month: number, closingDay: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.min(closingDay, lastDay);
}

export function getCurrentBillingCycleStart(closingDay: number, referenceDate = new Date()): Date {
  const { year, month, day } = getDatePartsInTimezone(referenceDate);
  const effectiveClosingThisMonth = getEffectiveClosingDay(year, month, closingDay);

  let closingYear = year;
  let closingMonth = month;

  if (day <= effectiveClosingThisMonth) {
    closingMonth -= 1;

    if (closingMonth < 1) {
      closingMonth = 12;
      closingYear -= 1;
    }
  }

  const effectiveClosing = getEffectiveClosingDay(closingYear, closingMonth, closingDay);

  let startYear = closingYear;
  let startMonth = closingMonth;
  let startDay = effectiveClosing + 1;

  const lastDayOfClosingMonth = new Date(Date.UTC(closingYear, closingMonth, 0)).getUTCDate();

  if (startDay > lastDayOfClosingMonth) {
    startDay = 1;
    startMonth += 1;

    if (startMonth > 12) {
      startMonth = 1;
      startYear += 1;
    }
  }

  return new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0, 0));
}

export function getBillingCycleEndDate(referenceDate = new Date(), timeZone = TIMEZONE): Date {
  const { year, month, day } = getDatePartsInTimezone(referenceDate, timeZone);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

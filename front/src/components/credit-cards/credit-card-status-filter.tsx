import {
  CategorySegmentedControl,
  type SegmentedOption,
} from "@/components/categories/category-segmented-control";
import type { CreditCard } from "@/services/credit-cards";

export type CreditCardStatusFilter = "all" | "active" | "blocked";

const STATUS_FILTER_OPTIONS: readonly SegmentedOption<CreditCardStatusFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "blocked", label: "Bloqueados" },
];

export function matchesCreditCardStatusFilter(
  creditCard: CreditCard,
  filter: CreditCardStatusFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return creditCard.isActive && !creditCard.isBlocked;
  }

  return creditCard.isActive && creditCard.isBlocked;
}

interface CreditCardStatusFilterProps {
  value: CreditCardStatusFilter;
  onChange: (value: CreditCardStatusFilter) => void;
  className?: string;
}

export function CreditCardStatusFilterControl({
  value,
  onChange,
  className,
}: CreditCardStatusFilterProps) {
  return (
    <CategorySegmentedControl
      legend="Status"
      options={STATUS_FILTER_OPTIONS}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

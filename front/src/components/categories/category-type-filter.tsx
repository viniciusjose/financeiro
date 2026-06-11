import {
  CategorySegmentedControl,
  type SegmentedOption,
} from "@/components/categories/category-segmented-control";
import type { Category } from "@/services/categories";

export type CategoryTypeFilter = "all" | "expense" | "income";

const TYPE_FILTER_OPTIONS: readonly SegmentedOption<CategoryTypeFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
];

export function matchesCategoryTypeFilter(category: Category, filter: CategoryTypeFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "expense") {
    return category.type === "expense" || category.type === "both";
  }

  return category.type === "income" || category.type === "both";
}

interface CategoryTypeFilterProps {
  value: CategoryTypeFilter;
  onChange: (value: CategoryTypeFilter) => void;
  className?: string;
}

export function CategoryTypeFilterControl({
  value,
  onChange,
  className,
}: CategoryTypeFilterProps) {
  return (
    <CategorySegmentedControl
      legend="Tipo"
      options={TYPE_FILTER_OPTIONS}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

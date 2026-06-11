import { cn } from "@/lib/utils";
import { CATEGORY_TYPE_LABELS, type CategoryType } from "@/schemas/category.schema";

const TYPE_STYLES: Record<CategoryType, string> = {
  expense: "border-destructive/20 bg-destructive/10 text-destructive",
  income: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
  both: "border-primary/20 bg-primary/10 text-primary",
};

interface CategoryTypeBadgeProps {
  type: CategoryType;
  className?: string;
}

export function CategoryTypeBadge({ type, className }: CategoryTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2 py-px text-[11px] leading-tight font-light",
        TYPE_STYLES[type],
        className,
      )}
    >
      {CATEGORY_TYPE_LABELS[type]}
    </span>
  );
}

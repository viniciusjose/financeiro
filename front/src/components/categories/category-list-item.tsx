import { Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CategoryTypeBadge } from "@/components/categories/category-type-badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { formatBudgetUsedPercent, getBudgetUsedPercent } from "@/lib/category-budget";
import { cn } from "@/lib/utils";
import type { Category } from "@/services/categories";

interface CategoryItemActionsProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  compact?: boolean;
}

interface CategoryListItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

interface CategoryGridItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function CategoryBudgetUsed({ category }: { category: Category }) {
  if (
    category.type !== "expense" ||
    category.spendingLimitCents == null ||
    category.monthSpentCents == null
  ) {
    return <span className="text-muted-foreground/60">—</span>;
  }

  const percent = getBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents);

  return (
    <span
      className={cn(
        "tabular-money text-caption",
        percent >= 100 ? "text-destructive" : percent >= 80 ? "text-amber-600" : "text-muted-foreground",
      )}
    >
      {formatBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents)}
    </span>
  );
}

function CategoryBudgetProgress({ category }: { category: Category }) {
  if (
    category.type !== "expense" ||
    category.spendingLimitCents == null ||
    category.monthSpentCents == null
  ) {
    return null;
  }

  const percent = getBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents);
  const fillPercent = Math.min(percent, 100);
  const fillColor =
    percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="mt-3 w-full">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-light text-muted-foreground">
        <span>Utilizado no mês</span>
        <span
          className={cn(
            "tabular-money",
            percent >= 100 ? "text-destructive" : percent >= 80 ? "text-amber-600" : "text-ink-secondary",
          )}
        >
          {formatBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${formatBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents)} do orçamento utilizado no mês`}
      >
        <div
          className={cn("h-full rounded-full motion-reduce:transition-none", fillColor)}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

function CategoryIconBadge({ category, size = "md" }: { category: Category; size?: "md" | "lg" }) {
  const iconSize = size === "lg" ? 24 : 20;
  const containerClass = size === "lg" ? "size-12" : "size-10";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        containerClass,
      )}
      style={{ backgroundColor: `${category.color}22` }}
    >
      <CategoryIcon icon={category.icon} color={category.color} size={iconSize} />
    </div>
  );
}

function CategoryItemActions({ category, onEdit, onDelete, compact = false }: CategoryItemActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", compact ? "justify-center" : "justify-end")}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={() => onEdit(category)}
        aria-label={`Editar ${category.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost-destructive"
        size="icon"
        className="size-9"
        onClick={() => onDelete(category)}
        aria-label={`Excluir ${category.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function CategoryListItem({ category, onEdit, onDelete }: CategoryListItemProps) {
  return (
    <tr className={cn("border-t border-hairline first:border-t-0", !category.isActive && "opacity-80")}>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIconBadge category={category} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-normal text-ink">{category.name}</p>
              {!category.isActive ? (
                <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-caption text-muted-foreground">
                  Arquivada
                </span>
              ) : null}
            </div>
            {category.description ? (
              <p className="mt-0.5 truncate text-caption text-muted-foreground">{category.description}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <CategoryTypeBadge type={category.type} />
      </td>
      <td className="hidden px-4 py-3 text-caption text-muted-foreground md:table-cell">
        {category.type === "expense" && category.spendingLimitCents != null ? (
          <span className="tabular-money">{formatCents(category.spendingLimitCents)}</span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <CategoryBudgetUsed category={category} />
      </td>
      <td className="px-4 py-3">
        <CategoryItemActions category={category} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

export function CategoryGridItem({ category, onEdit, onDelete }: CategoryGridItemProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-hairline bg-canvas p-4",
        !category.isActive && "opacity-80",
      )}
    >
      <div className="flex flex-1 flex-col items-center gap-3 text-center">
        <CategoryIconBadge category={category} size="lg" />
        <div className="min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="truncate text-[15px] font-normal text-ink">{category.name}</p>
            {!category.isActive ? (
              <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-caption text-muted-foreground">
                Arquivada
              </span>
            ) : null}
          </div>
          <CategoryTypeBadge type={category.type} className="mt-1" />
          {category.type === "expense" && category.spendingLimitCents != null ? (
            <p className="mt-1 text-caption text-muted-foreground">
              Orçamento: <span className="tabular-money">{formatCents(category.spendingLimitCents)}</span>
            </p>
          ) : null}
          {category.type === "expense" &&
          category.spendingLimitCents != null &&
          category.monthSpentCents != null ? (
            <CategoryBudgetProgress category={category} />
          ) : null}
          {category.description ? (
            <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">{category.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <CategoryItemActions category={category} onEdit={onEdit} onDelete={onDelete} compact />
      </div>
    </article>
  );
}

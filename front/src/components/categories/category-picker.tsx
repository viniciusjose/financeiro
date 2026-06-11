import { Link } from "react-router-dom";
import { CategoryIcon } from "@/components/categories/category-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Category } from "@/services/categories";

interface CategoryPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  categories: Category[];
  transactionType: "income" | "expense";
  disabled?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  categories,
  transactionType,
  disabled,
}: CategoryPickerProps) {
  const filtered = categories.filter(
    (category) =>
      category.isActive && (category.type === "both" || category.type === transactionType),
  );

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-4 py-6 text-center">
        <p className="text-[14px] font-light text-muted-foreground">
          Nenhuma categoria compatível encontrada.
        </p>
        <Link
          to="/categories"
          className="mt-3 inline-block text-[14px] text-primary hover:underline"
        >
          Criar categoria
        </Link>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(null)}
        className={cn(
          "flex h-8 w-full items-center justify-center rounded-lg border px-2 text-center transition-colors",
          value === null
            ? "border-primary bg-primary-subdued"
            : "border-hairline bg-canvas hover:bg-canvas-soft",
        )}
      >
        <span className="text-caption font-light leading-none text-muted-foreground">
          Sem categoria
        </span>
      </button>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {filtered.map((category) => {
        const selected = value === category.id;

        return (
          <Tooltip key={category.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(category.id)}
                className={cn(
                  "flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-colors",
                  selected ? "border-ink shadow-sm" : "border-hairline hover:shadow-sm",
                )}
                style={{
                  borderColor: selected ? category.color : undefined,
                  backgroundColor: `${category.color}12`,
                }}
              >
                <div
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  <CategoryIcon icon={category.icon} color={category.color} size={14} />
                </div>
                <span className="line-clamp-2 w-full min-w-0 wrap-break-word text-caption font-light leading-tight text-ink">
                  {category.name}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="z-[100]">
              {category.name}
            </TooltipContent>
          </Tooltip>
        );
      })}
      </div>
    </div>
    </TooltipProvider>
  );
}

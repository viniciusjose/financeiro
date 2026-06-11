import { LayoutGrid, LayoutList } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { CategoryViewMode } from "@/lib/category-view-storage";

const VIEW_OPTIONS: readonly {
  value: CategoryViewMode;
  label: string;
  Icon: typeof LayoutList;
}[] = [
  { value: "list", label: "Lista", Icon: LayoutList },
  { value: "grid", label: "Grade", Icon: LayoutGrid },
];

interface CategoryViewToggleProps {
  value: CategoryViewMode;
  onChange: (value: CategoryViewMode) => void;
  className?: string;
}

export function CategoryViewToggle({ value, onChange, className }: CategoryViewToggleProps) {
  const groupName = useId();

  return (
    <div
      className={cn(
        "flex rounded-full border border-hairline bg-canvas-soft p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Visualização"
    >
      {VIEW_OPTIONS.map(({ value: mode, label, Icon }) => {
        const selected = value === mode;

        return (
          <label
            key={mode}
            title={label}
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 motion-reduce:transition-none",
              selected
                ? "bg-primary text-on-primary"
                : "text-muted-foreground hover:text-ink-secondary",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={mode}
              checked={selected}
              onChange={() => onChange(mode)}
              className="sr-only"
              aria-label={label}
            />
            <Icon className="size-4" aria-hidden="true" />
          </label>
        );
      })}
    </div>
  );
}

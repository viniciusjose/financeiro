import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface CategorySegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabledValues?: readonly T[];
  legend?: string;
  ariaLabel?: string;
  className?: string;
  controlClassName?: string;
  stretch?: boolean;
}

export function CategorySegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabledValues,
  legend,
  ariaLabel,
  className,
  controlClassName,
  stretch = false,
}: CategorySegmentedControlProps<T>) {
  const groupName = useId();

  const control = (
    <div
      className={cn(
        "flex rounded-full border border-hairline bg-canvas-soft p-0.5",
        stretch ? "w-full" : "w-fit",
        controlClassName,
      )}
      role="radiogroup"
      aria-label={legend ?? ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.value;
        const isDisabled = disabledValues?.includes(option.value) ?? false;

        return (
          <label
            key={option.value}
            className={cn(
              "flex min-h-8 items-center justify-center rounded-full px-2.5 py-1 text-[13px] transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 motion-reduce:transition-none",
              stretch ? "min-w-0 flex-1 px-2.5 sm:px-3" : "flex-none px-3",
              isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
              selected
                ? "bg-primary font-normal text-on-primary"
                : "font-light text-muted-foreground",
              !isDisabled && !selected && "hover:text-ink-secondary",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={selected}
              disabled={isDisabled}
              onChange={() => {
                if (!isDisabled) {
                  onChange(option.value);
                }
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );

  if (!legend) {
    return <div className={className}>{control}</div>;
  }

  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className="mb-2 block text-caption text-muted-foreground">{legend}</legend>
      {control}
    </fieldset>
  );
}

import { useId } from "react";
import { CATEGORY_COLOR_PALETTE } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

interface CategoryColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  legend?: string;
}

export function CategoryColorPicker({
  value,
  onChange,
  disabled,
  legend = "Cor da categoria",
}: CategoryColorPickerProps) {
  const groupName = useId();

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-6 gap-2">
        {CATEGORY_COLOR_PALETTE.map((item) => {
          const selected = value === item.hex;

          return (
            <label
              key={item.hex}
              title={item.label}
              className={cn(
                "relative block aspect-square cursor-pointer rounded-md border-2 transition-[border-color,box-shadow] focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 motion-reduce:transition-none",
                selected ? "border-ink ring-2 ring-ink ring-offset-2" : "border-transparent",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={item.hex}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(item.hex)}
                className="sr-only"
                aria-label={item.label}
              />
              <span
                className="block size-full rounded-[4px]"
                style={{ backgroundColor: item.hex }}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { CategoryIcon } from "@/components/categories/category-icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import { InputTrigger } from "@/components/ui/input-trigger";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

interface CategoryIconPickerProps {
  value: string;
  color: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CategoryIconPicker({
  value,
  color,
  onValueChange,
  disabled,
  className,
}: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = CATEGORY_ICONS.find((item) => item.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <InputTrigger
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={className}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <CategoryIcon icon={value} color={color} size={18} />
              {selected?.label ?? value}
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </InputTrigger>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Buscar ícone..." />
          <CommandList className="max-h-64">
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            <CommandGroup>
              {CATEGORY_ICONS.map((item) => (
                <CommandItem
                  key={item.name}
                  value={`${item.label} ${item.name}`}
                  onSelect={() => {
                    onValueChange(item.name);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("size-4", value === item.name ? "opacity-100" : "opacity-0")}
                  />
                  <CategoryIcon icon={item.name} color={color} size={18} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

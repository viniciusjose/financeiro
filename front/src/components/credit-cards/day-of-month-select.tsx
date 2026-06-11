import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
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
import { DAY_OF_MONTH_OPTIONS } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

interface DayOfMonthSelectProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DayOfMonthSelect({
  value,
  onValueChange,
  disabled,
  className,
}: DayOfMonthSelectProps) {
  const [open, setOpen] = useState(false);

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
            <span className="truncate">Dia {value}</span>
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
          <CommandInput placeholder="Buscar dia..." />
          <CommandList>
            <CommandEmpty>Nenhum dia encontrado.</CommandEmpty>
            <CommandGroup>
              {DAY_OF_MONTH_OPTIONS.map((day) => (
                <CommandItem
                  key={day}
                  value={`Dia ${day}`}
                  onSelect={() => {
                    onValueChange(day);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("size-4", value === day ? "opacity-100" : "opacity-0")}
                  />
                  Dia {day}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

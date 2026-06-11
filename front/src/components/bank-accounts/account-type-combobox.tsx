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
import {
  BANK_ACCOUNT_TYPE_LABELS,
  BANK_ACCOUNT_TYPES,
  type BankAccountType,
} from "@/lib/bank-logos";
import { cn } from "@/lib/utils";

interface AccountTypeComboboxProps {
  value: BankAccountType;
  onValueChange: (value: BankAccountType) => void;
  disabled?: boolean;
  className?: string;
}

export function AccountTypeCombobox({
  value,
  onValueChange,
  disabled,
  className,
}: AccountTypeComboboxProps) {
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
            <span className="truncate">{BANK_ACCOUNT_TYPE_LABELS[value]}</span>
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
          <CommandInput placeholder="Buscar tipo..." />
          <CommandList>
            <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
            <CommandGroup>
              {BANK_ACCOUNT_TYPES.map((type) => (
                <CommandItem
                  key={type}
                  value={BANK_ACCOUNT_TYPE_LABELS[type]}
                  onSelect={() => {
                    onValueChange(type);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("size-4", value === type ? "opacity-100" : "opacity-0")}
                  />
                  {BANK_ACCOUNT_TYPE_LABELS[type]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { BankLogo } from "@/components/bank-accounts/bank-logo";
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
import { getBankLabel } from "@/lib/bank-logos";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@/services/bank-accounts";

interface BankAccountPickerProps {
  accounts: BankAccount[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function BankAccountPicker({
  accounts,
  value,
  onValueChange,
  disabled,
  className,
}: BankAccountPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedAccount = accounts.find((account) => account.id === value);

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
            {selectedAccount ? (
              <span className="flex min-w-0 items-center gap-2">
                <BankLogo
                  bank={selectedAccount.bank}
                  bankName={selectedAccount.bankName}
                  size="sm"
                />
                <span className="truncate">{selectedAccount.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione a conta de pagamento</span>
            )}
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
          <CommandInput placeholder="Buscar conta..." />
          <CommandList>
            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={`${account.name} ${getBankLabel(account.bank, account.bankName)}`}
                  onSelect={() => {
                    onValueChange(account.id);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("size-4", value === account.id ? "opacity-100" : "opacity-0")}
                  />
                  <BankLogo bank={account.bank} bankName={account.bankName} size="sm" />
                  <span className="truncate">
                    {account.name} · {getBankLabel(account.bank, account.bankName)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

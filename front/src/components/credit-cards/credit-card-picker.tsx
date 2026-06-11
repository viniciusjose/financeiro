import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { CardBrandLogo } from "@/components/credit-cards/card-brand-logo";
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
import { cn } from "@/lib/utils";
import type { CreditCard } from "@/services/credit-cards";

interface CreditCardPickerProps {
  creditCards: CreditCard[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function CreditCardPicker({
  creditCards,
  value,
  onValueChange,
  disabled,
  className,
}: CreditCardPickerProps) {
  const [open, setOpen] = useState(false);
  const availableCards = creditCards.filter((card) => card.isActive && !card.isBlocked);
  const selectedCard = availableCards.find((card) => card.id === value);

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
            {selectedCard ? (
              <span className="flex min-w-0 items-center gap-2">
                <CardBrandLogo
                  brand={selectedCard.brand}
                  brandName={selectedCard.brandName}
                  size="sm"
                />
                <span className="truncate">
                  {selectedCard.name} · •••• {selectedCard.lastFourDigits}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sem cartão</span>
            )}
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </InputTrigger>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cartão..." />
          <CommandList>
            <CommandEmpty>Nenhum cartão ativo encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <CheckIcon className={cn("mr-2 size-4", value === null ? "opacity-100" : "opacity-0")} />
                Sem cartão
              </CommandItem>
              {availableCards.map((card) => (
                <CommandItem
                  key={card.id}
                  value={`${card.name} ${card.lastFourDigits}`}
                  onSelect={() => {
                    onValueChange(card.id);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === card.id ? "opacity-100" : "opacity-0")}
                  />
                  <CardBrandLogo brand={card.brand} brandName={card.brandName} size="sm" />
                  <span className="truncate">
                    {card.name} · •••• {card.lastFourDigits}
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

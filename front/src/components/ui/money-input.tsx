import type * as React from "react";
import { Input } from "@/components/ui/input";
import { maskBrlInput } from "@/lib/money";
import { cn } from "@/lib/utils";

function MoneyInput({ className, onChange, value, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      inputMode="decimal"
      placeholder="0,00"
      autoComplete="off"
      className={cn("tabular-money", className)}
      value={value ?? ""}
      onChange={(event) => {
        const masked = maskBrlInput(event.target.value);
        event.target.value = masked;
        onChange?.(event);
      }}
      {...props}
    />
  );
}

export { MoneyInput };

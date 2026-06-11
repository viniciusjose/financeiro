import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { BankLogo } from "@/components/bank-accounts/bank-logo";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BANK_INSTITUTIONS, BANK_LOGOS } from "@/lib/bank-logos";
import { cn } from "@/lib/utils";

interface BankSelectorProps<T extends FieldValues> {
  control: Control<T>;
  bankName: FieldPath<T>;
  bankField: FieldPath<T>;
}

export function BankSelector<T extends FieldValues>({
  control,
  bankField,
  bankName,
}: BankSelectorProps<T>) {
  const selectedBank = useWatch({ control, name: bankField });

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={bankField}
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Banco</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BANK_INSTITUTIONS.map((bank) => {
                  const isSelected = field.value === bank;

                  return (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => field.onChange(bank)}
                      className={cn(
                        "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-center transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 text-ink"
                          : "border-hairline bg-canvas text-ink hover:bg-canvas-soft",
                      )}
                    >
                      <BankLogo bank={bank} size="md" className="object-center" />
                      <span className="w-full truncate text-[13px] font-normal leading-tight text-ink">
                        {BANK_LOGOS[bank].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedBank === "other" ? (
        <FormField
          control={control}
          name={bankName}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nome do banco</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: C6 Bank" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}

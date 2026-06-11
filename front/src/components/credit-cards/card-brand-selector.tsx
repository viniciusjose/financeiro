import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { CardBrandLogo } from "@/components/credit-cards/card-brand-logo";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CARD_BRANDS, CREDIT_CARD_BRANDS } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

interface CardBrandSelectorProps<T extends FieldValues> {
  control: Control<T>;
  brandField: FieldPath<T>;
  brandNameField: FieldPath<T>;
}

export function CardBrandSelector<T extends FieldValues>({
  control,
  brandField,
  brandNameField,
}: CardBrandSelectorProps<T>) {
  const selectedBrand = useWatch({ control, name: brandField });

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={brandField}
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Bandeira</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CREDIT_CARD_BRANDS.map((brand) => {
                  const isSelected = field.value === brand;

                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => field.onChange(brand)}
                      className={cn(
                        "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-center transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 text-ink"
                          : "border-hairline bg-canvas text-ink hover:bg-canvas-soft",
                      )}
                    >
                      <CardBrandLogo brand={brand} size="md" />
                      <span className="w-full truncate text-[13px] font-normal leading-tight text-ink">
                        {CARD_BRANDS[brand].label}
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

      {selectedBrand === "other" ? (
        <FormField
          control={control}
          name={brandNameField}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Nome da bandeira</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Cabal" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CategoryColorPicker } from "@/components/categories/category-color-picker";
import { BankAccountPicker } from "@/components/credit-cards/bank-account-picker";
import { CardBrandSelector } from "@/components/credit-cards/card-brand-selector";
import { DayOfMonthSelect } from "@/components/credit-cards/day-of-month-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { CATEGORY_COLOR_PALETTE } from "@/lib/category-colors";
import { formatCentsAsBrlInput } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
  type CreateCreditCardInput,
  createCreditCardSchema,
  type UpdateCreditCardInput,
} from "@/schemas/credit-card.schema";
import type { BankAccount } from "@/services/bank-accounts";
import type { CreditCard } from "@/services/credit-cards";

interface CreditCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCard?: CreditCard;
  accounts: BankAccount[];
  onSubmit: (values: CreateCreditCardInput | UpdateCreditCardInput) => Promise<void>;
}

function getDefaultValues(accounts: BankAccount[], creditCard?: CreditCard): CreateCreditCardInput {
  if (!creditCard) {
    return {
      name: "",
      lastFourDigits: "",
      brand: "visa",
      brandName: "",
      closingDay: 1,
      dueDay: 10,
      bankAccountId: accounts[0]?.id ?? "",
      creditLimit: "",
      color: CATEGORY_COLOR_PALETTE[10].hex,
    };
  }

  return {
    name: creditCard.name,
    lastFourDigits: creditCard.lastFourDigits,
    brand: creditCard.brand,
    brandName: creditCard.brandName ?? "",
    closingDay: creditCard.closingDay,
    dueDay: creditCard.dueDay,
    bankAccountId: creditCard.bankAccountId,
    creditLimit:
      creditCard.creditLimitCents != null
        ? formatCentsAsBrlInput(creditCard.creditLimitCents)
        : "",
    color: creditCard.color ?? CATEGORY_COLOR_PALETTE[10].hex,
    isActive: creditCard.isActive,
  };
}

export function CreditCardFormDialog({
  open,
  onOpenChange,
  creditCard,
  accounts,
  onSubmit,
}: CreditCardFormDialogProps) {
  const isEditing = Boolean(creditCard);

  const form = useForm<CreateCreditCardInput>({
    resolver: zodResolver(createCreditCardSchema),
    defaultValues: getDefaultValues(accounts, creditCard),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(accounts, creditCard));
    }
  }, [accounts, creditCard, form, open]);

  const handleSubmit = async (values: CreateCreditCardInput) => {
    try {
      await onSubmit(values);
      toast.success(isEditing ? "Cartão atualizado com sucesso." : "Cartão criado com sucesso.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o cartão.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-hairline px-4 py-4 sm:px-6">
          <DialogTitle>{isEditing ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do cartão de crédito."
              : "Cadastre um cartão e vincule a conta que paga a fatura."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Descrição do cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Nubank Ultravioleta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastFourDigits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Últimos 4 dígitos</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={4} placeholder="4521" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardBrandSelector
                  control={form.control}
                  brandField="brand"
                  brandNameField="brandName"
                />

                <FormField
                  control={form.control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite do cartão</FormLabel>
                      <FormControl>
                        <MoneyInput placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Conta de pagamento</FormLabel>
                      <BankAccountPicker
                        accounts={accounts}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={field.disabled || accounts.length === 0}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="closingDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Dia de fechamento</FormLabel>
                        <DayOfMonthSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={field.disabled}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Dia de vencimento</FormLabel>
                        <DayOfMonthSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={field.disabled}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do cartão</FormLabel>
                      <FormControl>
                        <CategoryColorPicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={field.disabled}
                          legend="Cor do cartão"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? true}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">Cartão ativo</FormLabel>
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-hairline px-4 py-4 sm:px-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || accounts.length === 0}>
                {isEditing ? "Salvar alterações" : "Cadastrar cartão"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

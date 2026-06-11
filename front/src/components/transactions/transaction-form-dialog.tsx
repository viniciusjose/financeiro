import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { CategoryPicker } from "@/components/categories/category-picker";
import { CreditCardPicker } from "@/components/credit-cards/credit-card-picker";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { getLocalIsoDate } from "@/lib/date";
import { formatCentsAsBrlInput } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  type CreateTransactionInput,
  createTransactionSchema,
  type UpdateTransactionInput,
} from "@/schemas/transaction.schema";
import type { Category } from "@/services/categories";
import type { CreditCard } from "@/services/credit-cards";
import type { Transaction } from "@/services/transactions";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  categories: Category[];
  creditCards: CreditCard[];
  defaultCreditCardId?: string | null;
  defaultDate?: string;
  lockCreditCard?: boolean;
  onSubmit: (values: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
}

function getDefaultValues(
  transaction?: Transaction,
  options?: { defaultCreditCardId?: string | null; defaultDate?: string },
): CreateTransactionInput {
  if (!transaction) {
    return {
      description: "",
      amount: "",
      type: "expense",
      categoryId: null,
      creditCardId: options?.defaultCreditCardId ?? null,
      date: options?.defaultDate ?? getLocalIsoDate(),
    };
  }

  return {
    description: transaction.description,
    amount: formatCentsAsBrlInput(transaction.amount),
    type: transaction.type,
    categoryId: transaction.categoryId,
    creditCardId: transaction.creditCardId,
    date: transaction.date.slice(0, 10),
  };
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  creditCards,
  defaultCreditCardId = null,
  defaultDate,
  lockCreditCard = false,
  onSubmit,
}: TransactionFormDialogProps) {
  const isEditing = Boolean(transaction);

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: getDefaultValues(transaction, { defaultCreditCardId, defaultDate }),
  });

  const transactionType = form.watch("type");
  const categoryId = form.watch("categoryId");
  const creditCardId = form.watch("creditCardId");

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(transaction, { defaultCreditCardId, defaultDate }));
    }
  }, [defaultCreditCardId, defaultDate, form, open, transaction]);

  useEffect(() => {
    if (categoryId === null || categoryId === undefined) {
      return;
    }

    const selected = categories.find((item) => item.id === categoryId);

    if (
      !selected?.isActive ||
      (selected && selected.type !== "both" && selected.type !== transactionType)
    ) {
      form.setValue("categoryId", null);
    }
  }, [categories, categoryId, form, transactionType]);

  useEffect(() => {
    if (transactionType !== "expense" && creditCardId != null) {
      form.setValue("creditCardId", null);
    }
  }, [creditCardId, form, transactionType]);

  useEffect(() => {
    if (lockCreditCard && transactionType === "expense" && defaultCreditCardId) {
      form.setValue("creditCardId", defaultCreditCardId);
    }
  }, [defaultCreditCardId, form, lockCreditCard, transactionType]);

  useEffect(() => {
    if (creditCardId === null || creditCardId === undefined) {
      return;
    }

    const selected = creditCards.find((item) => item.id === creditCardId);

    if (!selected?.isActive || selected.isBlocked) {
      form.setValue("creditCardId", null);
    }
  }, [creditCardId, creditCards, form]);

  const handleSubmit = async (values: CreateTransactionInput) => {
    const payload =
      lockCreditCard && defaultCreditCardId
        ? { ...values, type: "expense" as const, creditCardId: defaultCreditCardId }
        : values;

    try {
      await onSubmit(payload);
      toast.success(
        isEditing ? "Transação atualizada com sucesso." : "Transação criada com sucesso.",
      );
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar a transação.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-hairline px-4 py-4 sm:px-6">
          <DialogTitle>{isEditing ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da transação."
              : lockCreditCard
                ? "Registre uma despesa neste cartão."
                : "Registre uma receita ou despesa com categoria opcional."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Supermercado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Valor</FormLabel>
                      <FormControl>
                        <MoneyInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!lockCreditCard ? (
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Tipo</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-2">
                            {(["expense", "income"] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => field.onChange(type)}
                                className={cn(
                                  "rounded-md border px-3 py-2 text-[14px] font-light transition-colors",
                                  field.value === type
                                    ? "border-primary bg-primary-subdued text-primary-deep"
                                    : "border-hairline bg-canvas text-muted-foreground hover:bg-canvas-soft",
                                )}
                              >
                                {type === "expense" ? "Despesa" : "Receita"}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Data</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <CategoryPicker
                        value={field.value ?? null}
                        onChange={field.onChange}
                        categories={categories}
                        transactionType={transactionType}
                        disabled={field.disabled}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {transactionType === "expense" && !lockCreditCard ? (
                  <FormField
                    control={form.control}
                    name="creditCardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cartão de crédito</FormLabel>
                        <CreditCardPicker
                          creditCards={creditCards}
                          value={field.value ?? null}
                          onValueChange={field.onChange}
                          disabled={field.disabled}
                        />
                        <FormMessage />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Salvar alterações" : "Cadastrar transação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { CategoryPicker } from "@/components/categories/category-picker";
import { CategorySegmentedControl } from "@/components/categories/category-segmented-control";
import { BankAccountPicker } from "@/components/credit-cards/bank-account-picker";
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
import {
  type CreateTransactionInput,
  createTransactionSchema,
  getAmountLabel,
  getRecurrenceCountLabel,
  type TransactionMode,
  type UpdateTransactionInput,
} from "@/schemas/transaction.schema";
import type { BankAccount } from "@/services/bank-accounts";
import type { Category } from "@/services/categories";
import type { CreditCard } from "@/services/credit-cards";
import type { Transaction } from "@/services/transactions";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  categories: Category[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  defaultCreditCardId?: string | null;
  defaultDate?: string;
  lockCreditCard?: boolean;
  onSubmit: (
    values: CreateTransactionInput | UpdateTransactionInput,
  ) => Promise<boolean | undefined>;
}

const MODE_OPTIONS = [
  { value: "single", label: "Avulsa" },
  { value: "installment", label: "Parcelada" },
  { value: "recurring", label: "Recorrente" },
] as const satisfies ReadonlyArray<{ value: TransactionMode; label: string }>;

const TYPE_OPTIONS = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
] as const;

type ExpenseLinkKind = "none" | "bank_account" | "credit_card";

const EXPENSE_LINK_OPTIONS = [
  { value: "none", label: "Nenhum" },
  { value: "bank_account", label: "Conta" },
  { value: "credit_card", label: "Cartão" },
] as const satisfies ReadonlyArray<{ value: ExpenseLinkKind; label: string }>;

function getExpenseLinkKind(
  creditCardId: string | null | undefined,
  bankAccountId: string | null | undefined,
): ExpenseLinkKind {
  if (creditCardId) {
    return "credit_card";
  }

  if (bankAccountId) {
    return "bank_account";
  }

  return "none";
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
      bankAccountId: null,
      date: options?.defaultDate ?? getLocalIsoDate(),
      mode: "single",
      recurrenceCount: 12,
    };
  }

  return {
    description: transaction.description,
    amount: formatCentsAsBrlInput(transaction.amount),
    type: transaction.type,
    categoryId: transaction.categoryId,
    creditCardId: transaction.creditCardId,
    bankAccountId: transaction.bankAccountId,
    date: transaction.date.slice(0, 10),
    mode: "single",
    recurrenceCount: 12,
  };
}

function getDefaultRecurrenceCount(mode: TransactionMode) {
  return mode === "installment" ? 2 : 12;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  bankAccounts,
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
  const bankAccountId = form.watch("bankAccountId");
  const mode = form.watch("mode");
  const [expenseLinkKind, setExpenseLinkKind] = useState<ExpenseLinkKind>("none");
  const savedExpenseLinkKindRef = useRef<ExpenseLinkKind>("none");
  const expenseLinkKindRef = useRef(expenseLinkKind);
  const prevTransactionTypeRef = useRef(transactionType);

  expenseLinkKindRef.current = expenseLinkKind;

  const applyExpenseLinkKind = useCallback(
    (kind: ExpenseLinkKind) => {
      setExpenseLinkKind(kind);

      if (kind === "none") {
        form.setValue("bankAccountId", null);
        form.setValue("creditCardId", null);
        return;
      }

      if (kind === "bank_account") {
        form.setValue("creditCardId", null);
        return;
      }

      form.setValue("bankAccountId", null);
    },
    [form],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const values = getDefaultValues(transaction, { defaultCreditCardId, defaultDate });
    form.reset(values);
    const expenseKind = getExpenseLinkKind(values.creditCardId, values.bankAccountId);
    const linkKind = values.type === "income" ? "bank_account" : expenseKind;
    applyExpenseLinkKind(linkKind);
    savedExpenseLinkKindRef.current = values.type === "income" ? "none" : expenseKind;
    prevTransactionTypeRef.current = values.type;
  }, [applyExpenseLinkKind, defaultCreditCardId, defaultDate, form, open, transaction]);

  useEffect(() => {
    const prevType = prevTransactionTypeRef.current;

    if (prevType === transactionType) {
      return;
    }

    if (transactionType === "income") {
      savedExpenseLinkKindRef.current = expenseLinkKindRef.current;
      applyExpenseLinkKind("bank_account");
    } else if (prevType === "income") {
      applyExpenseLinkKind(savedExpenseLinkKindRef.current);
    }

    prevTransactionTypeRef.current = transactionType;
  }, [applyExpenseLinkKind, transactionType]);

  const handleExpenseLinkKindChange = (kind: ExpenseLinkKind) => {
    if (transactionType === "income" && kind !== "bank_account") {
      return;
    }

    applyExpenseLinkKind(kind);
  };

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

  useEffect(() => {
    if (bankAccountId === null || bankAccountId === undefined) {
      return;
    }

    const selected = bankAccounts.find((item) => item.id === bankAccountId);

    if (!selected?.isActive) {
      form.setValue("bankAccountId", null);
    }
  }, [bankAccountId, bankAccounts, form]);

  const handleSubmit = async (values: CreateTransactionInput) => {
    const payload =
      lockCreditCard && defaultCreditCardId
        ? {
            ...values,
            type: "expense" as const,
            creditCardId: defaultCreditCardId,
            bankAccountId: null,
          }
        : values;

    try {
      const shouldClose = await onSubmit(payload);

      if (shouldClose === false) {
        return;
      }

      toast.success(
        isEditing
          ? "Transação atualizada com sucesso."
          : values.mode === "single"
            ? "Transação criada com sucesso."
            : "Transações criadas com sucesso.",
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
                {!lockCreditCard ? (
                  <>
                    <FormItem>
                      <FormLabel required={transactionType === "income"}>Registrar em</FormLabel>
                      <CategorySegmentedControl
                        options={EXPENSE_LINK_OPTIONS}
                        value={expenseLinkKind}
                        onChange={handleExpenseLinkKindChange}
                        disabledValues={
                          transactionType === "income" ? (["none", "credit_card"] as const) : undefined
                        }
                        ariaLabel="Registrar em"
                        stretch
                      />
                    </FormItem>

                    {expenseLinkKind === "bank_account" ? (
                      <FormField
                        control={form.control}
                        name="bankAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required={transactionType === "income"}>Conta bancária</FormLabel>
                            <BankAccountPicker
                              accounts={bankAccounts}
                              value={field.value ?? null}
                              onValueChange={field.onChange}
                              disabled={field.disabled}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    {expenseLinkKind === "credit_card" ? (
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
                  </>
                ) : null}

                {!isEditing ? (
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Modo</FormLabel>
                        <FormControl>
                          <CategorySegmentedControl
                            options={MODE_OPTIONS}
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              form.setValue("recurrenceCount", getDefaultRecurrenceCount(value));
                            }}
                            ariaLabel="Modo"
                            stretch
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{getAmountLabel(mode, isEditing)}</FormLabel>
                        <FormControl>
                          <MoneyInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isEditing && mode !== "single" ? (
                  <FormField
                    control={form.control}
                    name="recurrenceCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{getRecurrenceCountLabel(mode)}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            max={48}
                            inputMode="numeric"
                            value={field.value ?? ""}
                            onChange={(event) => {
                              const parsed = Number(event.target.value);
                              field.onChange(event.target.value === "" ? undefined : parsed);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {!lockCreditCard ? (
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Tipo</FormLabel>
                        <FormControl>
                          <CategorySegmentedControl
                            options={TYPE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Tipo"
                            stretch
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

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

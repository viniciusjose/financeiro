import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AccountTypeCombobox } from "@/components/bank-accounts/account-type-combobox";
import { BankSelector } from "@/components/bank-accounts/bank-selector";
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
import { formatCentsAsBrlInput } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
  type CreateBankAccountInput,
  createBankAccountSchema,
  type UpdateBankAccountInput,
} from "@/schemas/bank-account.schema";
import type { BankAccount } from "@/services/bank-accounts";

interface BankAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount;
  onSubmit: (values: CreateBankAccountInput | UpdateBankAccountInput) => Promise<void>;
}

function getDefaultValues(account?: BankAccount): CreateBankAccountInput {
  if (!account) {
    return {
      name: "",
      bank: "nubank",
      bankName: "",
      type: "checking",
      initialBalance: "",
      isDefault: false,
    };
  }

  return {
    name: account.name,
    bank: account.bank,
    bankName: account.bankName ?? "",
    type: account.type,
    initialBalance: formatCentsAsBrlInput(account.initialBalance),
    isDefault: account.isDefault,
    isActive: account.isActive,
  };
}

export function BankAccountFormDialog({
  open,
  onOpenChange,
  account,
  onSubmit,
}: BankAccountFormDialogProps) {
  const isEditing = Boolean(account);

  const form = useForm<CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: getDefaultValues(account),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(account));
    }
  }, [account, form, open]);

  const handleSubmit = async (values: CreateBankAccountInput) => {
    try {
      await onSubmit(values);
      toast.success(isEditing ? "Conta atualizada com sucesso." : "Conta criada com sucesso.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a conta.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-hairline px-4 py-4 sm:px-6">
          <DialogTitle>{isEditing ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da conta bancária."
              : "Cadastre uma conta para organizar suas finanças por instituição."}
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
                      <FormLabel required>Apelido da conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Conta corrente principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BankSelector control={form.control} bankField="bank" bankName="bankName" />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Tipo da conta</FormLabel>
                      <AccountTypeCombobox
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
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo inicial</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="decimal"
                          placeholder="0,00"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer font-normal">
                        Definir como conta padrão
                      </FormLabel>
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
                        <FormLabel className="cursor-pointer font-normal">Conta ativa</FormLabel>
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
                {isEditing ? "Salvar alterações" : "Cadastrar conta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { Plus } from "lucide-react";
import { useState } from "react";
import { BankAccountFormDialog } from "@/components/bank-accounts/bank-account-form-dialog";
import { PageShell } from "@/components/layout/page-shell";
import { BankAccountListItem } from "@/components/bank-accounts/bank-account-list-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { toast } from "@/lib/toast";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "@/schemas/bank-account.schema";
import type { BankAccount } from "@/services/bank-accounts";

export function AccountsPage() {
  const {
    accounts,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useBankAccounts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | undefined>();
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | undefined>();

  const openCreate = () => {
    setEditingAccount(undefined);
    setFormOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CreateBankAccountInput | UpdateBankAccountInput) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, values);
      return;
    }

    await createAccount(values);
  };

  const handleDelete = async () => {
    if (!deletingAccount) {
      return;
    }

    try {
      await deleteAccount(deletingAccount.id);
      toast.success("Conta removida com sucesso.");
      setDeletingAccount(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir a conta.";
      toast.error(message);
    }
  };

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-display-md text-ink">Contas</h1>
            <p className="mt-2 max-w-prose text-[15px] font-light text-muted-foreground">
              Gerencie suas contas bancárias por instituição.
            </p>
          </div>
          <Button type="button" size="sm" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nova conta
          </Button>
        </div>

        <label className="flex items-center gap-2 text-[14px] font-light text-muted-foreground">
          <Checkbox
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Mostrar arquivadas
        </label>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-lg border border-hairline bg-canvas p-6 text-[15px] font-light text-muted-foreground">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">Nenhuma conta cadastrada</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Cadastre sua primeira conta para organizar saldos e transações por banco.
            </p>
            <Button type="button" size="sm" className="mt-6" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Cadastrar primeira conta
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <BankAccountListItem
                key={account.id}
                account={account}
                onEdit={openEdit}
                onDelete={setDeletingAccount}
              />
            ))}
          </div>
        ) : null}
      </PageShell>

      <BankAccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editingAccount}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deletingAccount)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccount(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta "{deletingAccount?.name}" será removida permanentemente. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

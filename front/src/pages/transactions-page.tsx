import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategoryBadge } from "@/components/categories/category-badge";
import { PageShell } from "@/components/layout/page-shell";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCents } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/schemas/transaction.schema";
import type { Transaction } from "@/services/transactions";

export function TransactionsPage() {
  const { categories } = useCategories();
  const { creditCards } = useCreditCards();
  const {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | undefined>();

  const openCreate = () => {
    setEditingTransaction(undefined);
    setFormOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CreateTransactionInput | UpdateTransactionInput) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, values);
      return;
    }

    await createTransaction(values);
  };

  const handleDelete = async () => {
    if (!deletingTransaction) {
      return;
    }

    try {
      await deleteTransaction(deletingTransaction.id);
      toast.success("Transação removida com sucesso.");
      setDeletingTransaction(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir a transação.";
      toast.error(message);
    }
  };

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-display-md text-ink">Transações</h1>
            <p className="mt-2 max-w-prose text-[15px] font-light text-muted-foreground">
              Registre receitas e despesas com categorias visuais.
            </p>
          </div>
          <Button type="button" size="sm" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nova transação
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-lg border border-hairline bg-canvas p-6 text-[15px] font-light text-muted-foreground">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">Nenhuma transação cadastrada</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Comece registrando sua primeira receita ou despesa.
            </p>
            <Button type="button" size="sm" className="mt-6" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Cadastrar primeira transação
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-normal text-ink">{transaction.description}</h2>
                    {transaction.category ? (
                      <CategoryBadge
                        name={transaction.category.name}
                        icon={transaction.category.icon}
                        color={transaction.category.color}
                      />
                    ) : (
                      <span className="text-caption text-muted-foreground">Sem categoria</span>
                    )}
                  </div>
                  <p className="text-caption text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p
                    className={cn(
                      "tabular-money text-[15px] font-normal",
                      transaction.type === "income" ? "text-emerald-600" : "text-ink",
                    )}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCents(transaction.amount)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${transaction.description}`}
                    onClick={() => openEdit(transaction)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Excluir ${transaction.description}`}
                    onClick={() => setDeletingTransaction(transaction)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </PageShell>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editingTransaction}
        categories={categories}
        creditCards={creditCards}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTransaction(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              A transação "{deletingTransaction?.description}" será removida permanentemente.
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

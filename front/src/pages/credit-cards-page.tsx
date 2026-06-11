import { Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCardFormDialog } from "@/components/credit-cards/credit-card-form-dialog";
import { CreditCardGridItem, CreditCardListItem } from "@/components/credit-cards/credit-card-list-item";
import {
  CreditCardStatusFilterControl,
  matchesCreditCardStatusFilter,
  type CreditCardStatusFilter,
} from "@/components/credit-cards/credit-card-status-filter";
import { CreditCardViewToggle } from "@/components/credit-cards/credit-card-view-toggle";
import { PageShell } from "@/components/layout/page-shell";
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
import { useCreditCards } from "@/hooks/use-credit-cards";
import {
  getCreditCardViewMode,
  setCreditCardViewMode,
  type CreditCardViewMode,
} from "@/lib/credit-card-view-storage";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  creditCardToUpdateInput,
  type CreateCreditCardInput,
  type UpdateCreditCardInput,
} from "@/schemas/credit-card.schema";
import type { CreditCard } from "@/services/credit-cards";

export function CreditCardsPage() {
  const {
    creditCards,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useCreditCards();

  const { accounts, isLoading: isLoadingAccounts } = useBankAccounts();

  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();
  const [deletingCard, setDeletingCard] = useState<CreditCard | undefined>();
  const [blockingCard, setBlockingCard] = useState<CreditCard | undefined>();
  const [viewMode, setViewMode] = useState<CreditCardViewMode>(() => getCreditCardViewMode());
  const [statusFilter, setStatusFilter] = useState<CreditCardStatusFilter>("all");
  const includeInactiveId = useId();

  const filteredCreditCards = useMemo(() => {
    return creditCards.filter((creditCard) => matchesCreditCardStatusFilter(creditCard, statusFilter));
  }, [creditCards, statusFilter]);

  const handleViewModeChange = (mode: CreditCardViewMode) => {
    setViewMode(mode);
    setCreditCardViewMode(mode);
  };

  const canCreateCard = activeAccounts.length > 0;

  const openCreate = () => {
    if (!canCreateCard) {
      return;
    }

    setEditingCard(undefined);
    setFormOpen(true);
  };

  const openEdit = (creditCard: CreditCard) => {
    setEditingCard(creditCard);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CreateCreditCardInput | UpdateCreditCardInput) => {
    if (editingCard) {
      await updateCreditCard(editingCard.id, values);
      return;
    }

    await createCreditCard(values);
  };

  const handleToggleBlock = async () => {
    if (!blockingCard) {
      return;
    }

    const willBlock = !blockingCard.isBlocked;

    try {
      await updateCreditCard(
        blockingCard.id,
        creditCardToUpdateInput(blockingCard, { isBlocked: willBlock }),
      );
      toast.success(willBlock ? "Cartão bloqueado com sucesso." : "Cartão desbloqueado com sucesso.");
      setBlockingCard(undefined);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : willBlock
            ? "Não foi possível bloquear o cartão."
            : "Não foi possível desbloquear o cartão.";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingCard) {
      return;
    }

    try {
      await deleteCreditCard(deletingCard.id);
      toast.success("Cartão removido com sucesso.");
      setDeletingCard(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir o cartão.";
      toast.error(message);
    }
  };

  const isPageLoading = isLoading || isLoadingAccounts;

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-display-md text-ink">Cartões</h1>
            <p className="mt-2 max-w-prose text-[15px] font-light text-muted-foreground">
              Cadastre cartões de crédito e vincule a conta que paga a fatura.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={openCreate}
            disabled={!canCreateCard}
          >
            <Plus aria-hidden="true" />
            Novo cartão
          </Button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <CreditCardStatusFilterControl value={statusFilter} onChange={setStatusFilter} />

          <div className="flex flex-wrap items-center gap-4">
            <CreditCardViewToggle value={viewMode} onChange={handleViewModeChange} />

            <label
            htmlFor={includeInactiveId}
            className="flex shrink-0 items-center gap-2 text-[14px] font-light text-muted-foreground"
          >
            <Checkbox
              id={includeInactiveId}
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Mostrar arquivados
          </label>
          </div>
        </div>

        {isPageLoading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "flex flex-wrap gap-4"
                : "space-y-3",
            )}
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Carregando cartões</span>
            <Skeleton
              className={cn(
                viewMode === "grid" ? "min-h-[14rem] w-[21rem] max-w-full rounded-xl" : "h-16 w-full rounded-lg",
              )}
            />
            <Skeleton
              className={cn(
                viewMode === "grid" ? "min-h-[14rem] w-[21rem] max-w-full rounded-xl" : "h-16 w-full rounded-lg",
              )}
            />
            {viewMode === "grid" ? (
              <Skeleton className="hidden min-h-[14rem] w-[21rem] max-w-full rounded-xl sm:block" />
            ) : null}
          </div>
        ) : null}

        {!isPageLoading && !canCreateCard ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">Cadastre uma conta bancária primeiro</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Para vincular o pagamento da fatura, você precisa de ao menos uma conta bancária
              ativa.
            </p>
            <Button type="button" size="sm" className="mt-6" asChild>
              <Link to="/accounts">
                <Plus aria-hidden="true" />
                Cadastrar conta
              </Link>
            </Button>
          </div>
        ) : null}

        {!isPageLoading && canCreateCard && error ? (
          <div className="rounded-lg border border-hairline bg-canvas p-6 text-[15px] font-light text-muted-foreground">
            {error}
          </div>
        ) : null}

        {!isPageLoading && canCreateCard && !error && creditCards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">Nenhum cartão cadastrado</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Cadastre seu primeiro cartão com os últimos 4 dígitos, bandeira e ciclo de fatura.
            </p>
            <Button type="button" size="sm" className="mt-6" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Cadastrar primeiro cartão
            </Button>
          </div>
        ) : null}

        {!isPageLoading && canCreateCard && !error && creditCards.length > 0 && filteredCreditCards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">
              Nenhum cartão{" "}
              {statusFilter === "active" ? "ativo" : statusFilter === "blocked" ? "bloqueado" : "encontrado"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Ajuste o filtro de status ou exiba cartões arquivados para ampliar a busca.
            </p>
            <Button type="button" variant="outline" className="mt-6" onClick={() => setStatusFilter("all")}>
              Ver todos
            </Button>
          </div>
        ) : null}

        {!isPageLoading && canCreateCard && !error && filteredCreditCards.length > 0 && viewMode === "list" ? (
          <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-hairline bg-canvas-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 text-caption font-normal text-muted-foreground">
                    Cartão
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground sm:table-cell"
                  >
                    Ciclo
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground md:table-cell"
                  >
                    Limite
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground md:table-cell"
                  >
                    Fatura atual
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground lg:table-cell"
                  >
                    % utilizado
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground lg:table-cell"
                  >
                    Conta de pagamento
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-normal text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCreditCards.map((creditCard) => (
                  <CreditCardListItem
                    key={creditCard.id}
                    creditCard={creditCard}
                    onEdit={openEdit}
                    onDelete={setDeletingCard}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isPageLoading && canCreateCard && !error && filteredCreditCards.length > 0 && viewMode === "grid" ? (
          <ul className="flex flex-wrap gap-4">
            {filteredCreditCards.map((creditCard) => (
              <li key={creditCard.id} className="w-fit">
                <CreditCardGridItem
                  creditCard={creditCard}
                  onEdit={openEdit}
                  onBlock={setBlockingCard}
                  onDelete={setDeletingCard}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </PageShell>

      <CreditCardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        creditCard={editingCard}
        accounts={activeAccounts}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(blockingCard)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingCard(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockingCard?.isBlocked ? "Desbloquear cartão?" : "Bloquear cartão?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockingCard?.isBlocked ? (
                <>
                  O cartão "{blockingCard.name}" voltará a aceitar novas transações.
                </>
              ) : (
                <>
                  O cartão "{blockingCard?.name}" continuará ativo, mas não será possível lançar
                  novas transações nele.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleToggleBlock()}>
              {blockingCard?.isBlocked ? "Desbloquear" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCard(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              O cartão "{deletingCard?.name}" será removido permanentemente. Esta ação não pode ser
              desfeita.
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

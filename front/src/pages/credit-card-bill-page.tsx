import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BankLogo } from "@/components/bank-accounts/bank-logo";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { CategoryBadge } from "@/components/categories/category-badge";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CardBrandLogo } from "@/components/credit-cards/card-brand-logo";
import { CreditCardFormDialog } from "@/components/credit-cards/credit-card-form-dialog";
import { PageShell } from "@/components/layout/page-shell";
import { SeriesScopeDialog } from "@/components/transactions/series-scope-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionSeriesBadge } from "@/components/transactions/transaction-series-badge";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useCreditCardBill } from "@/hooks/use-credit-card-bill";
import { useAuth } from "@/providers/auth-provider";
import { getBankLabel } from "@/lib/bank-logos";
import { formatDueDayLabel, formatMaskedCardNumber } from "@/lib/card-brands";
import {
  formatCreditLimitUsedPercent,
  getAvailableLimitCents,
  getCreditCardLimitUsedCents,
  getCreditLimitUsedPercent,
} from "@/lib/credit-card-limit";
import {
  formatBudgetUsedPercent,
  getBudgetUsedPercent,
} from "@/lib/category-budget";
import { formatCents } from "@/lib/money";
import { getTodayInMonth } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import { getUserDisplayName } from "@/lib/user-display";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { UpdateCreditCardInput } from "@/schemas/credit-card.schema";
import type {
  ApplyScope,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/schemas/transaction.schema";
import type { UpdateCategoryInput } from "@/schemas/category.schema";
import {
  type CreditCard,
  type CreditCardBillTransaction,
  creditCardsService,
} from "@/services/credit-cards";
import { type Transaction, transactionsService } from "@/services/transactions";
import type { Category } from "@/services/categories";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonthYearLabel(month: number, year: number) {
  return `${MONTH_LABELS[month]}/${String(year).slice(-2)}`;
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

type BillTransactionSortColumn = "category" | "date" | "amount";
type SortDirection = "asc" | "desc";

function toEditableTransaction(
  billTransaction: CreditCardBillTransaction,
  creditCardId: string,
): Transaction {
  return {
    id: billTransaction.id,
    description: billTransaction.description,
    amount: billTransaction.amount,
    type: "expense",
    categoryId: billTransaction.category?.id ?? null,
    creditCardId,
    seriesId: billTransaction.seriesId,
    seriesKind: billTransaction.seriesKind,
    seriesIndex: billTransaction.seriesIndex,
    seriesTotal: billTransaction.seriesTotal,
    category: billTransaction.category,
    date: billTransaction.date,
    createdAt: "",
    updatedAt: "",
  };
}

type PendingBillEdit = {
  transaction: Transaction;
  values: UpdateTransactionInput;
};

function sortBillTransactions(
  transactions: CreditCardBillTransaction[],
  column: BillTransactionSortColumn,
  direction: SortDirection,
) {
  const sorted = [...transactions];
  const multiplier = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    if (column === "category") {
      const nameA = a.category?.name ?? "Sem categoria";
      const nameB = b.category?.name ?? "Sem categoria";
      return multiplier * nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
    }

    if (column === "date") {
      return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return multiplier * (a.amount - b.amount);
  });

  return sorted;
}

function BillSortableHeader({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  column: BillTransactionSortColumn;
  sortColumn: BillTransactionSortColumn;
  sortDirection: SortDirection;
  onSort: (column: BillTransactionSortColumn) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const isActive = sortColumn === column;
  const SortIcon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={cn(className, align === "right" && "text-right")}
      aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-0.5 py-0.5 text-caption font-normal transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          isActive ? "text-ink" : "text-ink-mute",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <SortIcon className="size-3.5 shrink-0" aria-hidden="true" />
      </button>
    </th>
  );
}

function isBillOverdue(cycleEnd: string, dueDay: number) {
  const end = new Date(cycleEnd);
  const now = new Date();
  const dueDate = new Date(end.getFullYear(), end.getMonth(), dueDay, 23, 59, 59, 999);

  if (dueDate <= end) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  return now > dueDate;
}

type NavigatorMonth = {
  label: string;
  month: number;
  year: number;
  isSelected: boolean;
  isCurrentOpenBill: boolean;
};

function getMonthNavigatorMonths(
  referenceDate: Date,
  currentOpenBillMonth: { month: number; year: number } | null,
): NavigatorMonth[] {
  const centerMonth = referenceDate.getMonth();
  const centerYear = referenceDate.getFullYear();
  const months: NavigatorMonth[] = [];

  for (let offset = -2; offset <= 2; offset += 1) {
    const monthDate = new Date(centerYear, centerMonth + offset, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    months.push({
      label: formatMonthYearLabel(month, year),
      month,
      year,
      isSelected: offset === 0,
      isCurrentOpenBill:
        currentOpenBillMonth != null &&
        month === currentOpenBillMonth.month &&
        year === currentOpenBillMonth.year,
    });
  }

  return months;
}

function aggregateByCategory(transactions: CreditCardBillTransaction[]) {
  const totals = new Map<
    string,
    {
      categoryId: string | null;
      name: string;
      color: string;
      icon: string;
      totalCents: number;
    }
  >();

  for (const transaction of transactions) {
    const key = transaction.category?.id ?? "__uncategorized__";
    const existing = totals.get(key);

    if (existing) {
      existing.totalCents += transaction.amount;
      continue;
    }

    totals.set(key, {
      categoryId: transaction.category?.id ?? null,
      name: transaction.category?.name ?? "Sem categoria",
      color: transaction.category?.color ?? "#64748d",
      icon: transaction.category?.icon ?? "circle",
      totalCents: transaction.amount,
    });
  }

  return [...totals.values()].sort((a, b) => b.totalCents - a.totalCents);
}

function BillCardVisual({
  creditCard,
  cardholderName,
  onEdit,
}: {
  creditCard: CreditCard;
  cardholderName: string;
  onEdit: () => void;
}) {
  const cardColor = creditCard.color ?? "#533afd";
  const bankLabel = getBankLabel(creditCard.bankAccount.bank, creditCard.bankAccount.bankName);

  return (
    <div
      className="relative flex aspect-[1.75/1] flex-col overflow-hidden rounded-xl px-4 py-3 text-on-primary shadow-[var(--shadow-panel)]"
      style={{ backgroundColor: cardColor }}
    >
      <div className="flex items-start justify-between gap-2">
        {creditCard.bankAccount.bank === "other" ? (
          <p className="truncate text-[14px] font-normal">{bankLabel}</p>
        ) : (
          <BankLogo
            bank={creditCard.bankAccount.bank}
            bankName={creditCard.bankAccount.bankName}
            size="sm"
            className="brightness-0 invert"
          />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
            onClick={onEdit}
            aria-label="Editar cartão"
          >
            <Pencil className="size-3.5" />
          </Button>
          <CardBrandLogo brand={creditCard.brand} brandName={creditCard.brandName} size="sm" />
        </div>
      </div>

      <p className="mt-4 tabular-money text-[15px] tracking-[0.12em]">
        {formatMaskedCardNumber(creditCard.lastFourDigits)}
      </p>

      <div className="mt-auto pt-3">
        <p className="truncate text-[12px] font-normal uppercase tracking-wide">{cardholderName}</p>
        <p className="mt-0.5 text-[11px] font-light text-white/70">{formatDueDayLabel(creditCard.dueDay)}</p>
      </div>
    </div>
  );
}

function BillSidebarCard({
  title,
  titleAside,
  children,
  className,
}: {
  title?: string;
  titleAside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-hairline bg-canvas px-4 py-3.5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-normal text-ink-mute">{title}</h2>
          {titleAside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function BillLimitProgress({
  spentCents,
  limitCents,
  label = "Usado",
  className,
}: {
  spentCents: number;
  limitCents: number;
  label?: string;
  className?: string;
}) {
  const percent = getCreditLimitUsedPercent(spentCents, limitCents);
  const fillPercent = Math.min(percent, 100);
  const fillColor =
    percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div className={cn("mt-3", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] font-light text-ink-mute">
        <span>{label}</span>
        <span
          className={cn(
            "tabular-money",
            percent >= 100
              ? "text-destructive"
              : percent >= 80
                ? "text-amber-600"
                : "text-ink-secondary",
          )}
        >
          {formatCreditLimitUsedPercent(spentCents, limitCents)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${formatCreditLimitUsedPercent(spentCents, limitCents)} do limite utilizado`}
      >
        <div
          className={cn("h-full rounded-full motion-reduce:transition-none", fillColor)}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

type BillStatCardTone = "primary" | "expense" | "insight";

const billStatCardToneStyles: Record<
  BillStatCardTone,
  { card: string; icon: string; detail?: string }
> = {
  primary: {
    card: "border-primary/20 bg-primary/[0.05]",
    icon: "bg-primary/12 text-primary",
  },
  expense: {
    card: "border-destructive/20 bg-destructive/[0.04]",
    icon: "bg-destructive/10 text-destructive",
    detail: "text-destructive/80",
  },
  insight: {
    card: "border-hairline-input/50 bg-canvas-soft",
    icon: "bg-ink/[0.06] text-ink-secondary",
  },
};

function BillStatCard({
  icon: Icon,
  label,
  value,
  detail,
  detailClassName,
  tone = "insight",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  detailClassName?: string;
  tone?: BillStatCardTone;
}) {
  const toneStyle = billStatCardToneStyles[tone];

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3.5",
        toneStyle.card,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
            toneStyle.icon,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-light text-ink-mute">{label}</p>
          <p className="tabular-money mt-0.5 text-[20px] font-normal text-ink">{value}</p>
          {detail ? (
            <p
              className={cn(
                "mt-0.5 truncate text-[12px] font-light",
                detailClassName ?? toneStyle.detail ?? "text-ink-mute",
              )}
            >
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BillLoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(17rem,20rem)_1fr]" role="status" aria-live="polite">
      <span className="sr-only">Carregando fatura</span>
      <div className="space-y-3">
        <Skeleton className="aspect-[1.75/1] w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CreditCardBillPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { categories, updateCategory } = useCategories();
  const { accounts } = useBankAccounts();
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const { bill, isLoading, isBillLoading, error: billQueryError } = useCreditCardBill(id, referenceDate);
  const error = !id ? "Cartão inválido." : billQueryError;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<BillTransactionSortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [creditCardFormOpen, setCreditCardFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deletingTransaction, setDeletingTransaction] = useState<
    CreditCardBillTransaction | undefined
  >();
  const [pendingEdit, setPendingEdit] = useState<PendingBillEdit | undefined>();
  const [scopeDialogMode, setScopeDialogMode] = useState<"edit" | "delete" | null>(null);
  const [isScopeSubmitting, setIsScopeSubmitting] = useState(false);
  const [currentOpenBillMonth, setCurrentOpenBillMonth] = useState<{
    month: number;
    year: number;
    cycleEnd: string;
  } | null>(null);

  const invalidateBillData = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    ]);
  }, [queryClient]);

  useEffect(() => {
    setCurrentOpenBillMonth(null);
  }, [id]);

  useEffect(() => {
    if (!bill?.isCurrentOpenCycle) {
      return;
    }

    const cycleEndDate = new Date(bill.cycleEnd);
    setCurrentOpenBillMonth({
      month: cycleEndDate.getMonth(),
      year: cycleEndDate.getFullYear(),
      cycleEnd: bill.cycleEnd,
    });
  }, [bill?.cycleEnd, bill?.isCurrentOpenCycle]);

  const selectMonth = useCallback((month: number, year: number) => {
    setReferenceDate(new Date(year, month, 1));
  }, []);

  const shiftSelectedMonth = useCallback((offset: number) => {
    setReferenceDate((current) => shiftMonth(current, offset));
  }, []);

  const creditCard = bill?.creditCard;
  const totalSpentCents = bill?.totalSpentCents ?? 0;
  const currentOpenBillSpentCents = creditCard?.currentBillSpentCents ?? 0;
  const limitUsedCents = creditCard ? getCreditCardLimitUsedCents(creditCard) : 0;
  const creditLimitCents = creditCard?.creditLimitCents ?? null;
  const currentOpenAvailableLimitCents =
    creditLimitCents != null ? getAvailableLimitCents(creditLimitCents, limitUsedCents) : null;
  const currentOpenLimitPercent =
    creditLimitCents != null && creditLimitCents > 0
      ? getCreditLimitUsedPercent(limitUsedCents, creditLimitCents)
      : null;

  const cardholderName = getUserDisplayName(user?.name, user?.email).toUpperCase();
  const canCreateTransaction = Boolean(creditCard?.isActive && !creditCard?.isBlocked);
  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);

  const openEditCreditCard = () => {
    setCreditCardFormOpen(true);
  };

  const handleSubmitCreditCard = async (values: UpdateCreditCardInput) => {
    if (!creditCard) {
      return;
    }

    await creditCardsService.update(creditCard.id, values);
    await invalidateBillData();
  };

  const openEditCategory = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleSubmitCategory = async (values: UpdateCategoryInput) => {
    if (!editingCategory) {
      return;
    }

    await updateCategory(editingCategory.id, values);
    await invalidateBillData();
  };

  const openCreate = () => {
    setEditingTransaction(undefined);
    setTransactionFormOpen(true);
  };

  const openEdit = (billTransaction: CreditCardBillTransaction) => {
    if (!creditCard) {
      return;
    }

    setEditingTransaction(toEditableTransaction(billTransaction, creditCard.id));
    setTransactionFormOpen(true);
  };

  const handleSubmitTransaction = async (values: CreateTransactionInput | UpdateTransactionInput) => {
    if (!creditCard) {
      return;
    }

    const payload: CreateTransactionInput | UpdateTransactionInput = {
      ...values,
      type: "expense",
      creditCardId: creditCard.id,
    };

    if (editingTransaction) {
      if (editingTransaction.seriesId) {
        setPendingEdit({ transaction: editingTransaction, values: payload });
        setScopeDialogMode("edit");
        setTransactionFormOpen(false);
        return false;
      }

      await transactionsService.update(editingTransaction.id, payload);
      setEditingTransaction(undefined);
    } else {
      await transactionsService.create(payload);
    }

    await invalidateBillData();
  };

  const handleScopeConfirm = async (scope: ApplyScope) => {
    setIsScopeSubmitting(true);

    try {
      if (scopeDialogMode === "edit" && pendingEdit) {
        await transactionsService.update(pendingEdit.transaction.id, pendingEdit.values, scope);
        toast.success("Transação atualizada com sucesso.");
        setPendingEdit(undefined);
        setEditingTransaction(undefined);
      }

      if (scopeDialogMode === "delete" && deletingTransaction) {
        await transactionsService.delete(deletingTransaction.id, scope);
        toast.success("Transação removida com sucesso.");
        setDeletingTransaction(undefined);
      }

      setScopeDialogMode(null);
      await invalidateBillData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível concluir a operação.";
      toast.error(message);
    } finally {
      setIsScopeSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) {
      return;
    }

    try {
      await transactionsService.delete(deletingTransaction.id);
      toast.success("Transação removida com sucesso.");
      setDeletingTransaction(undefined);
      await invalidateBillData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir a transação.";
      toast.error(message);
    }
  };

  const requestDeleteTransaction = (transaction: CreditCardBillTransaction) => {
    if (transaction.seriesId) {
      setDeletingTransaction(transaction);
      setScopeDialogMode("delete");
      return;
    }

    setDeletingTransaction(transaction);
  };

  const filteredTransactions = useMemo(() => {
    if (!bill) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return bill.transactions;
    }

    return bill.transactions.filter((transaction) => {
      const description = transaction.description.toLowerCase();
      const category = transaction.category?.name.toLowerCase() ?? "";
      return description.includes(query) || category.includes(query);
    });
  }, [bill, searchQuery]);

  const sortedTransactions = useMemo(
    () => sortBillTransactions(filteredTransactions, sortColumn, sortDirection),
    [filteredTransactions, sortColumn, sortDirection],
  );

  const handleSort = (column: BillTransactionSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "date" ? "desc" : "asc");
  };

  const categoryBreakdown = useMemo(() => {
    if (!bill) {
      return [];
    }

    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    return aggregateByCategory(bill.transactions).map((item) => {
      const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined;

      return {
        ...item,
        spendingLimitCents: category?.spendingLimitCents ?? null,
        monthSpentCents: category?.monthSpentCents ?? null,
      };
    });
  }, [bill, categories]);

  const largestTransaction = useMemo(() => {
    if (!bill || bill.transactions.length === 0) {
      return null;
    }

    return bill.transactions.reduce((max, transaction) =>
      transaction.amount > max.amount ? transaction : max,
    );
  }, [bill]);

  const averagePerPurchase = useMemo(() => {
    if (!bill || bill.transactions.length === 0) {
      return 0;
    }

    return Math.round(totalSpentCents / bill.transactions.length);
  }, [bill, totalSpentCents]);

  const monthNavigator = useMemo(
    () => getMonthNavigatorMonths(referenceDate, currentOpenBillMonth),
    [currentOpenBillMonth, referenceDate],
  );
  const defaultTransactionDate = useMemo(
    () => getTodayInMonth(referenceDate),
    [referenceDate],
  );

  const isCurrentOpenBillOverdue =
    creditCard && currentOpenBillMonth
      ? isBillOverdue(currentOpenBillMonth.cycleEnd, creditCard.dueDay)
      : false;

  return (
    <>
      <PageShell className="max-w-7xl">
      {isLoading && !bill ? <BillLoadingSkeleton /> : null}

      {!isLoading && error ? (
        <div className="rounded-lg border border-hairline bg-canvas p-6 text-[15px] font-light text-muted-foreground shadow-[var(--shadow-card)]">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && bill && creditCard ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(17rem,20rem)_1fr]">
          <aside className="space-y-3">
            <BillCardVisual
              creditCard={creditCard}
              cardholderName={cardholderName}
              onEdit={openEditCreditCard}
            />

            <BillSidebarCard>
              <div className="flex items-start gap-2.5">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-canvas-soft text-ink-mute">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-normal text-ink-mute">Fatura do mês</p>
                  <p className="tabular-money mt-0.5 text-[26px] font-normal text-ink">
                    {formatCents(currentOpenBillSpentCents)}
                  </p>
                  {isCurrentOpenBillOverdue ? (
                    <p className="mt-0.5 text-[12px] font-normal text-amber-600">Fatura vencida</p>
                  ) : (
                    <p className="mt-0.5 text-[12px] font-light text-ink-mute">Em aberto</p>
                  )}
                </div>
              </div>
            </BillSidebarCard>

            <BillSidebarCard
              title="Situação"
              titleAside={
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-normal text-amber-700 ring-1 ring-amber-200/80">
                  Em aberto
                </span>
              }
            >
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="font-light text-ink-mute">Limite total</dt>
                  <dd className="tabular-money font-normal text-ink">
                    {formatCents(creditLimitCents ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="font-light text-ink-mute">Disponível</dt>
                  <dd
                    className={cn(
                      "tabular-money font-normal",
                      currentOpenAvailableLimitCents != null && currentOpenAvailableLimitCents <= 0
                        ? "text-destructive"
                        : "text-emerald-600",
                    )}
                  >
                    {formatCents(currentOpenAvailableLimitCents ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="font-light text-ink-mute">Vencimento</dt>
                  <dd className="font-normal text-ink">{formatDueDayLabel(creditCard.dueDay)}</dd>
                </div>
              </dl>
              {currentOpenLimitPercent != null && creditLimitCents != null ? (
                <BillLimitProgress
                  spentCents={limitUsedCents}
                  limitCents={creditLimitCents}
                  label="Uso do limite"
                  className="mt-2.5"
                />
              ) : null}
            </BillSidebarCard>

            {categoryBreakdown.length > 0 ? (
              <BillSidebarCard title="Por categoria">
                <ul className="mt-2.5 space-y-3">
                  {categoryBreakdown.slice(0, 5).map((category) => {
                    const sharePercent =
                      totalSpentCents > 0
                        ? Math.round((category.totalCents / totalSpentCents) * 100)
                        : 0;
                    const hasBudget =
                      category.spendingLimitCents != null && category.monthSpentCents != null;
                    const budgetPercent =
                      hasBudget && category.monthSpentCents != null && category.spendingLimitCents != null
                        ? getBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents)
                        : null;
                    const progressPercent = budgetPercent ?? sharePercent;
                    const progressFillPercent = Math.min(progressPercent, 100);
                    const budgetFillColor =
                      budgetPercent != null && budgetPercent >= 100
                        ? "bg-destructive"
                        : budgetPercent != null && budgetPercent >= 80
                          ? "bg-amber-500"
                          : "bg-primary";
                    const isOverBudget =
                      category.spendingLimitCents != null &&
                      (budgetPercent != null
                        ? budgetPercent >= 100
                        : category.totalCents > category.spendingLimitCents);

                    return (
                      <li key={category.categoryId ?? category.name} className="group/category">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <span
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${category.color}22` }}
                            >
                              <CategoryIcon icon={category.icon} color={category.color} size={14} />
                            </span>
                            <span className="min-w-0 truncate text-[13px] font-light text-ink">
                              {category.name}
                            </span>
                            {category.categoryId ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0 opacity-0 transition-opacity group-hover/category:opacity-100 focus-visible:opacity-100"
                                aria-label={`Editar ${category.name}`}
                                onClick={() => {
                                  if (category.categoryId) {
                                    openEditCategory(category.categoryId);
                                  }
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                          <span className="tabular-money shrink-0 text-[13px] font-normal">
                            <span className={isOverBudget ? "text-destructive" : "text-ink"}>
                              {formatCents(category.totalCents)}
                            </span>
                            {category.spendingLimitCents != null ? (
                              <>
                                <span className="font-light text-ink-mute"> / </span>
                                <span className="font-light text-ink-mute">
                                  {formatCents(category.spendingLimitCents)}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft"
                          role="progressbar"
                          aria-valuenow={progressPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={
                            budgetPercent != null &&
                            category.monthSpentCents != null &&
                            category.spendingLimitCents != null
                              ? `${category.name}: ${formatBudgetUsedPercent(category.monthSpentCents, category.spendingLimitCents)} do orçamento utilizado no mês`
                              : `${category.name}: ${sharePercent}% da fatura`
                          }
                        >
                          <div
                            className={cn(
                              "h-full rounded-full motion-reduce:transition-none",
                              budgetPercent != null ? budgetFillColor : undefined,
                            )}
                            style={{
                              width: `${progressFillPercent}%`,
                              ...(budgetPercent == null ? { backgroundColor: category.color } : {}),
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </BillSidebarCard>
            ) : null}
          </aside>

          <div className="min-w-0 space-y-4">
            <div
              className={cn(
                "flex w-full items-center gap-1.5 transition-opacity",
                isBillLoading && "pointer-events-none opacity-60",
              )}
            >
              <button
                type="button"
                onClick={() => shiftSelectedMonth(-1)}
                disabled={isBillLoading}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft hover:text-ink disabled:opacity-50"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                {monthNavigator.map((month) => (
                  <button
                    key={`${month.year}-${month.month}`}
                    type="button"
                    disabled={isBillLoading}
                    onClick={() => selectMonth(month.month, month.year)}
                    aria-current={month.isSelected ? "date" : undefined}
                    aria-label={
                      month.isCurrentOpenBill && !month.isSelected
                        ? `${month.label}, fatura atual aberta`
                        : month.label
                    }
                    className={cn(
                      "inline-flex min-w-0 flex-1 items-center justify-center rounded-lg border px-2 py-1.5 text-[13px] font-normal transition-colors",
                      month.isSelected
                        ? "border-primary bg-primary text-on-primary shadow-none"
                        : month.isCurrentOpenBill
                          ? "border-primary bg-transparent text-ink hover:bg-canvas-soft"
                          : "border-transparent bg-transparent text-ink-mute hover:bg-canvas-soft hover:text-ink",
                    )}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => shiftSelectedMonth(1)}
                disabled={isBillLoading}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft hover:text-ink disabled:opacity-50"
                aria-label="Próximo mês"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <BillStatCard
                icon={FileText}
                label="Total da fatura"
                value={formatCents(totalSpentCents)}
                detail={`${bill.transactions.length} transaç${bill.transactions.length === 1 ? "ão" : "ões"}`}
                tone="primary"
              />
              <BillStatCard
                icon={TrendingUp}
                label="Maior gasto"
                value={largestTransaction ? formatCents(largestTransaction.amount) : "—"}
                detail={largestTransaction?.description}
                tone="expense"
              />
              <BillStatCard
                icon={Calculator}
                label="Média por compra"
                value={bill.transactions.length > 0 ? formatCents(averagePerPurchase) : "—"}
                detail={
                  bill.transactions.length > 0
                    ? `${bill.transactions.length} compra${bill.transactions.length === 1 ? "" : "s"} no ciclo`
                    : undefined
                }
                tone="insight"
              />
            </div>

            <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-3 border-b border-hairline px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-heading-sm text-ink">Lançamentos</h2>
                  {canCreateTransaction ? (
                    <Button
                      type="button"
                      size="icon"
                      className="size-8 shrink-0 [&_svg]:size-3.5"
                      aria-label="Nova transação"
                      onClick={openCreate}
                    >
                      <Plus aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-mute"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar lançamento..."
                    className="h-9 bg-canvas-soft pl-9"
                    aria-label="Buscar lançamento"
                  />
                </div>
              </div>

              {bill.transactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <h3 className="text-heading-sm text-ink">Nenhuma despesa neste ciclo</h3>
                  <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
                    As despesas lançadas neste cartão no período atual aparecerão aqui.
                  </p>
                  {canCreateTransaction ? (
                    <Button
                      type="button"
                      size="sm"
                      className="mt-6"
                      onClick={openCreate}
                    >
                      <Plus aria-hidden="true" />
                      Registrar primeira despesa
                    </Button>
                  ) : null}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-[15px] font-light text-muted-foreground">
                    Nenhum lançamento corresponde à busca.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="border-b border-hairline bg-canvas-soft">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-2.5 text-caption font-normal text-ink-mute"
                        >
                          Descrição
                        </th>
                        <BillSortableHeader
                          label="Categoria"
                          column="category"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className="hidden px-4 py-2.5 sm:table-cell"
                        />
                        <BillSortableHeader
                          label="Data"
                          column="date"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className="px-4 py-2.5"
                        />
                        <BillSortableHeader
                          label="Valor"
                          column="amount"
                          sortColumn={sortColumn}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className="px-4 py-2.5 text-right"
                          align="right"
                        />
                        <th scope="col" className="w-[4.5rem] px-2 py-2.5">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-t border-hairline first:border-t-0">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {transaction.category ? (
                                <span
                                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                                  style={{ backgroundColor: `${transaction.category.color}18` }}
                                >
                                  <CategoryIcon
                                    icon={transaction.category.icon}
                                    color={transaction.category.color}
                                    size={16}
                                  />
                                </span>
                              ) : (
                                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas-soft text-[12px] font-normal text-ink-mute">
                                  {transaction.description.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="truncate text-[15px] font-normal text-ink">
                                  {transaction.description}
                                </span>
                                <TransactionSeriesBadge transaction={transaction} />
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            {transaction.category ? (
                              <CategoryBadge
                                name={transaction.category.name}
                                icon={transaction.category.icon}
                                color={transaction.category.color}
                              />
                            ) : (
                              <span className="text-caption text-muted-foreground">Sem categoria</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-caption text-ink-mute">
                            {new Date(transaction.date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-money text-[15px] font-normal text-destructive">
                              -{formatCents(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Editar ${transaction.description}`}
                                onClick={() => openEdit(transaction)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost-destructive"
                                size="icon"
                                className="size-8"
                                aria-label={`Excluir ${transaction.description}`}
                                onClick={() => requestDeleteTransaction(transaction)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
      </PageShell>

      {creditCard ? (
        <CreditCardFormDialog
          open={creditCardFormOpen}
          onOpenChange={setCreditCardFormOpen}
          creditCard={creditCard}
          accounts={activeAccounts}
          onSubmit={handleSubmitCreditCard}
        />
      ) : null}

      {creditCard ? (
        <TransactionFormDialog
          open={transactionFormOpen}
          onOpenChange={(open) => {
            setTransactionFormOpen(open);

            if (!open) {
              setEditingTransaction(undefined);
            }
          }}
          transaction={editingTransaction}
          categories={categories}
          creditCards={[creditCard]}
          defaultCreditCardId={creditCard.id}
          defaultDate={defaultTransactionDate}
          lockCreditCard
          onSubmit={handleSubmitTransaction}
        />
      ) : null}

      <CategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={(open) => {
          setCategoryFormOpen(open);

          if (!open) {
            setEditingCategory(undefined);
          }
        }}
        category={editingCategory}
        onSubmit={handleSubmitCategory}
      />

      {scopeDialogMode && (pendingEdit?.transaction.description ?? deletingTransaction?.description) ? (
        <SeriesScopeDialog
          open={Boolean(scopeDialogMode)}
          onOpenChange={(open) => {
            if (!open) {
              setScopeDialogMode(null);
              setPendingEdit(undefined);
            }
          }}
          mode={scopeDialogMode}
          description={
            scopeDialogMode === "edit"
              ? (pendingEdit?.transaction.description ?? "")
              : (deletingTransaction?.description ?? "")
          }
          onConfirm={(scope) => void handleScopeConfirm(scope)}
          isSubmitting={isScopeSubmitting}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deletingTransaction) && !deletingTransaction?.seriesId}
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
              A transação &quot;{deletingTransaction?.description}&quot; será removida permanentemente
              deste cartão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDeleteTransaction()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

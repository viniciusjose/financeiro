import { CalendarSync, Layers } from "lucide-react";
import type { Transaction } from "@/services/transactions";
import { cn } from "@/lib/utils";

interface TransactionSeriesBadgeProps {
  transaction: Pick<
    Transaction,
    "seriesId" | "seriesKind" | "seriesIndex" | "seriesTotal"
  >;
  className?: string;
}

export function TransactionSeriesBadge({ transaction, className }: TransactionSeriesBadgeProps) {
  if (!transaction.seriesId || transaction.seriesIndex == null || transaction.seriesTotal == null) {
    return null;
  }

  const isInstallment = transaction.seriesKind === "installment";
  const Icon = isInstallment ? Layers : CalendarSync;
  const label = isInstallment ? "Parcela" : "Recorrente";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas-soft px-2 py-0.5 text-caption text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>
        {label} {transaction.seriesIndex}/{transaction.seriesTotal}
      </span>
    </span>
  );
}

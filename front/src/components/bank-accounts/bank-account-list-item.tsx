import { Pencil, Trash2 } from "lucide-react";
import { BankLogo } from "@/components/bank-accounts/bank-logo";
import { Button } from "@/components/ui/button";
import { BANK_ACCOUNT_TYPE_LABELS, getBankLabel } from "@/lib/bank-logos";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@/services/bank-accounts";

interface BankAccountListItemProps {
  account: BankAccount;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}

export function BankAccountListItem({ account, onEdit, onDelete }: BankAccountListItemProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-hairline bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between",
        !account.isActive && "opacity-80",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <BankLogo bank={account.bank} bankName={account.bankName} size="sm" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[15px] font-normal text-ink">{account.name}</h2>
            {account.isDefault ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-caption text-primary">
                Padrão
              </span>
            ) : null}
            {!account.isActive ? (
              <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-caption text-muted-foreground">
                Arquivada
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-caption text-muted-foreground">
            {getBankLabel(account.bank, account.bankName)} ·{" "}
            {BANK_ACCOUNT_TYPE_LABELS[account.type]}
          </p>
          <p className="mt-2 tabular-money text-[15px] font-normal text-ink">
            {formatCents(account.initialBalance)}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto sm:self-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10 flex-1 sm:flex-none"
          onClick={() => onEdit(account)}
        >
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost-destructive"
          size="sm"
          className="min-h-10 flex-1 sm:flex-none"
          onClick={() => onDelete(account)}
        >
          <Trash2 className="size-4" />
          Excluir
        </Button>
      </div>
    </article>
  );
}

import { Lock, LockOpen, Pencil, ReceiptText, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BankLogo } from "@/components/bank-accounts/bank-logo";
import { CardBrandLogo } from "@/components/credit-cards/card-brand-logo";
import { Button } from "@/components/ui/button";
import { getBankLabel } from "@/lib/bank-logos";
import { formatCardCycle, formatMaskedCardNumber } from "@/lib/card-brands";
import {
  formatCreditLimitUsedPercent,
  getAvailableLimitCents,
  getCreditLimitUsedPercent,
} from "@/lib/credit-card-limit";
import { getCreditCardBillPath } from "@/lib/credit-card-navigation";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CreditCard } from "@/services/credit-cards";

interface CreditCardItemActionsProps {
  creditCard: CreditCard;
  onEdit: (creditCard: CreditCard) => void;
  onDelete: (creditCard: CreditCard) => void;
  compact?: boolean;
}

interface CreditCardListItemProps {
  creditCard: CreditCard;
  onEdit: (creditCard: CreditCard) => void;
  onDelete: (creditCard: CreditCard) => void;
}

interface CreditCardGridItemProps {
  creditCard: CreditCard;
  onEdit: (creditCard: CreditCard) => void;
  onBlock: (creditCard: CreditCard) => void;
  onDelete: (creditCard: CreditCard) => void;
}

const creditCardGridActionButtonClassName =
  "min-h-8 flex-1 rounded-lg border border-hairline bg-canvas px-2 text-[12px] shadow-[0_1px_0_rgba(13,37,61,0.04)] transition-[background-color,border-color,box-shadow,transform] hover:border-hairline-input hover:bg-ink/[0.04] hover:shadow-sm active:translate-y-px active:bg-ink/[0.06] active:shadow-none";

function CreditCardItemActions({
  creditCard,
  onEdit,
  onDelete,
  compact = false,
}: CreditCardItemActionsProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Button type="button" variant="ghost" size="icon" className="size-9" asChild>
          <Link
            to={getCreditCardBillPath(creditCard.id)}
            aria-label={`Ver fatura de ${creditCard.name}`}
          >
            <ReceiptText className="size-4" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => onEdit(creditCard)}
          aria-label={`Editar ${creditCard.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon"
          className="size-9"
          onClick={() => onDelete(creditCard)}
          aria-label={`Excluir ${creditCard.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto sm:self-center">
      <Button type="button" variant="ghost" size="sm" className="min-h-10 flex-1 sm:flex-none" asChild>
        <Link to={getCreditCardBillPath(creditCard.id)}>
          <ReceiptText className="size-4" />
          Fatura
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-10 flex-1 sm:flex-none"
        onClick={() => onEdit(creditCard)}
      >
        <Pencil className="size-4" />
        Editar
      </Button>
      <Button
        type="button"
        variant="ghost-destructive"
        size="sm"
        className="min-h-10 flex-1 sm:flex-none"
        onClick={() => onDelete(creditCard)}
      >
        <Trash2 className="size-4" />
        Excluir
      </Button>
    </div>
  );
}

function CreditCardLimitUsed({ creditCard }: { creditCard: CreditCard }) {
  if (creditCard.creditLimitCents == null || creditCard.creditLimitCents <= 0) {
    return <span className="text-muted-foreground/60">—</span>;
  }

  const percent = getCreditLimitUsedPercent(
    creditCard.currentBillSpentCents,
    creditCard.creditLimitCents,
  );

  return (
    <span
      className={cn(
        "tabular-money text-caption",
        percent >= 100 ? "text-destructive" : percent >= 80 ? "text-amber-600" : "text-muted-foreground",
      )}
    >
      {formatCreditLimitUsedPercent(creditCard.currentBillSpentCents, creditCard.creditLimitCents)}
    </span>
  );
}

export function CreditCardListItem({ creditCard, onEdit, onDelete }: CreditCardListItemProps) {
  const bankLabel = getBankLabel(creditCard.bankAccount.bank, creditCard.bankAccount.bankName);

  return (
    <tr className={cn("border-t border-hairline first:border-t-0", !creditCard.isActive && "opacity-80")}>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {creditCard.color ? (
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: creditCard.color }}
              aria-hidden="true"
            />
          ) : null}
          <CardBrandLogo brand={creditCard.brand} brandName={creditCard.brandName} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-normal text-ink">{creditCard.name}</p>
              <span className="tabular-money text-caption text-muted-foreground">
                •••• {creditCard.lastFourDigits}
              </span>
              {!creditCard.isActive ? (
                <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-caption text-muted-foreground">
                  Arquivado
                </span>
              ) : null}
              {creditCard.isActive && creditCard.isBlocked ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption text-amber-900">
                  Bloqueado
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-caption text-muted-foreground sm:hidden">
              {formatCardCycle(creditCard.closingDay, creditCard.dueDay)}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-caption text-muted-foreground sm:table-cell">
        {formatCardCycle(creditCard.closingDay, creditCard.dueDay)}
      </td>
      <td className="hidden px-4 py-3 text-caption text-muted-foreground md:table-cell">
        {creditCard.creditLimitCents != null ? (
          <span className="tabular-money">{formatCents(creditCard.creditLimitCents)}</span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-caption text-muted-foreground md:table-cell">
        <span className="tabular-money">{formatCents(creditCard.currentBillSpentCents)}</span>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <CreditCardLimitUsed creditCard={creditCard} />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="flex min-w-0 items-center gap-2 text-caption text-muted-foreground">
          <BankLogo
            bank={creditCard.bankAccount.bank}
            bankName={creditCard.bankAccount.bankName}
            size="sm"
          />
          <span className="truncate">
            {creditCard.bankAccount.name} · {bankLabel}
            {!creditCard.bankAccount.isActive ? " (arquivada)" : ""}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <CreditCardItemActions creditCard={creditCard} onEdit={onEdit} onDelete={onDelete} compact />
      </td>
    </tr>
  );
}

function CreditCardFinancialRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] font-light">
      <span className="text-ink-mute">{label}</span>
      <span className={cn("tabular-money text-right font-normal text-ink", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function CreditCardLimitProgress({
  creditLimitCents,
  currentBillSpentCents,
}: {
  creditLimitCents: number;
  currentBillSpentCents: number;
}) {
  const percent = getCreditLimitUsedPercent(currentBillSpentCents, creditLimitCents);
  const fillPercent = Math.min(percent, 100);
  const fillColor =
    percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="pt-0.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-light text-ink-mute">
        <span>Uso do limite</span>
        <span
          className={cn(
            "tabular-money",
            percent >= 100 ? "text-destructive" : percent >= 80 ? "text-amber-600" : "text-ink-secondary",
          )}
        >
          {formatCreditLimitUsedPercent(currentBillSpentCents, creditLimitCents)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full border border-hairline bg-ink/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${formatCreditLimitUsedPercent(currentBillSpentCents, creditLimitCents)} do limite utilizado na fatura atual`}
      >
        <div
          className={cn("h-full rounded-full motion-reduce:transition-none", fillColor)}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

function CreditCardStatusBadge({
  isActive,
  isBlocked,
}: {
  isActive: boolean;
  isBlocked: boolean;
}) {
  if (!isActive) {
    return (
      <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-normal text-white/70">
        Arquivado
      </span>
    );
  }

  if (isBlocked) {
    return (
      <span className="shrink-0 rounded-full bg-amber-300/90 px-2 py-0.5 text-[10px] font-normal text-amber-950">
        Bloqueado
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-emerald-300/90 px-2 py-0.5 text-[10px] font-normal text-emerald-950">
      Ativo
    </span>
  );
}

export function CreditCardGridItem({
  creditCard,
  onEdit,
  onBlock,
  onDelete,
}: CreditCardGridItemProps) {
  const bankLabel = getBankLabel(creditCard.bankAccount.bank, creditCard.bankAccount.bankName);
  const cardColor = creditCard.color ?? "#533afd";
  const creditLimitCents = creditCard.creditLimitCents ?? 0;
  const currentBillSpentCents = creditCard.currentBillSpentCents ?? 0;
  const availableLimitCents = getAvailableLimitCents(creditLimitCents, currentBillSpentCents);

  return (
    <article
      className={cn(
        "flex w-[21rem] max-w-full flex-col overflow-hidden rounded-xl border border-hairline bg-canvas shadow-[var(--shadow-card)]",
        !creditCard.isActive && "opacity-90",
      )}
    >
      <div
        className="relative flex aspect-[1.75/1] flex-col px-3 py-2 text-on-primary"
        style={{ backgroundColor: cardColor }}
      >
        <div className="flex items-start justify-between gap-1.5">
          <p className="truncate text-[13px] font-normal">{bankLabel}</p>
          <CreditCardStatusBadge
            isActive={creditCard.isActive}
            isBlocked={creditCard.isBlocked}
          />
        </div>

        <p className="mt-1.5 tabular-money text-[13px] tracking-[0.1em]">
          {formatMaskedCardNumber(creditCard.lastFourDigits)}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wide">{creditCard.name}</p>
            <p className="mt-0.5 text-[10px] font-light text-white/60">
              {formatCardCycle(creditCard.closingDay, creditCard.dueDay)}
            </p>
          </div>
          <CardBrandLogo
            brand={creditCard.brand}
            brandName={creditCard.brandName}
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-2 bg-canvas-soft px-3 py-3 text-ink">
        <CreditCardFinancialRow
          label="Limite total"
          value={formatCents(creditLimitCents)}
        />
        <CreditCardFinancialRow
          label="Fatura atual"
          value={formatCents(currentBillSpentCents)}
        />
        <CreditCardLimitProgress
          creditLimitCents={creditLimitCents}
          currentBillSpentCents={currentBillSpentCents}
        />
        <CreditCardFinancialRow
          label="Limite disponível"
          value={formatCents(availableLimitCents)}
          valueClassName={
            creditLimitCents > 0 && availableLimitCents <= 0 ? "text-destructive" : undefined
          }
        />
        <div className="flex items-center gap-2 pt-0.5 text-[12px] font-light text-ink-mute">
          <BankLogo
            bank={creditCard.bankAccount.bank}
            bankName={creditCard.bankAccount.bankName}
            size="sm"
          />
          <span className="truncate">
            Pago em {creditCard.bankAccount.name}
            {!creditCard.bankAccount.isActive ? " (conta arquivada)" : ""}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-hairline bg-canvas-soft px-2.5 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={creditCardGridActionButtonClassName}
          asChild
        >
          <Link to={getCreditCardBillPath(creditCard.id)}>
            <ReceiptText className="size-3.5" />
            Fatura
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={creditCardGridActionButtonClassName}
          onClick={() => onEdit(creditCard)}
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
        {creditCard.isActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={creditCardGridActionButtonClassName}
            onClick={() => onBlock(creditCard)}
          >
            {creditCard.isBlocked ? (
              <LockOpen className="size-3.5" />
            ) : (
              <Lock className="size-3.5" />
            )}
            {creditCard.isBlocked ? "Desbloquear" : "Bloquear"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost-destructive"
          size="sm"
          className={cn(
            creditCardGridActionButtonClassName,
            "hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive hover:shadow-sm",
          )}
          onClick={() => onDelete(creditCard)}
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      </div>
    </article>
  );
}

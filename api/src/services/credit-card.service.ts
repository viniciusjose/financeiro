import { isValidCategoryColor } from "@/lib/category-icons.js";
import {
  getBillingCycle,
  getCurrentBillingCycleStart,
  getCurrentOpenBillingCycleEnd,
} from "@/lib/credit-card-billing.js";
import type { BankAccountRepository } from "@/repositories/bank-account.repository.js";
import type {
  CreditCardRepository,
  CreditCardWithBankAccount,
} from "@/repositories/credit-card.repository.js";
import type { TransactionRepository } from "@/repositories/transaction.repository.js";

const MAX_CARDS_PER_USER = 30;

type CreditCardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | "other";

export interface CreateCreditCardInput {
  userId: string;
  name: string;
  lastFourDigits: string;
  brand: CreditCardBrand;
  brandName?: string;
  closingDay: number;
  dueDay: number;
  bankAccountId: string;
  creditLimitCents?: number | null;
  color: string;
}

export interface UpdateCreditCardInput {
  id: string;
  userId: string;
  name?: string;
  lastFourDigits?: string;
  brand?: CreditCardBrand;
  brandName?: string | null;
  closingDay?: number;
  dueDay?: number;
  bankAccountId?: string;
  creditLimitCents?: number | null;
  color?: string;
  isActive?: boolean;
  isBlocked?: boolean;
}

export class CreditCardService {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async list(userId: string, includeInactive: boolean) {
    const rows = await this.creditCardRepository.list({ userId, includeInactive });
    const cardIds = rows.map(({ creditCard }) => creditCard.id);
    const [spentByCard, limitUsedByCard] = await Promise.all([
      this.transactionRepository.sumExpensesByCreditCardsForCurrentCycles(
        userId,
        rows.map(({ creditCard }) => {
          const cycleStart = getCurrentBillingCycleStart(creditCard.closingDay);
          return {
            creditCardId: creditCard.id,
            cycleStart,
            cycleEnd: getCurrentOpenBillingCycleEnd(creditCard.closingDay),
          };
        }),
      ),
      this.transactionRepository.sumExpensesByCreditCardsFromCurrentMonthOnward(userId, cardIds),
    ]);

    return {
      creditCards: rows.map((row) =>
        serializeCreditCardRow(row, {
          currentBillSpentCents: spentByCard.get(row.creditCard.id) ?? 0,
          limitUsedCents: limitUsedByCard.get(row.creditCard.id) ?? 0,
        }),
      ),
    };
  }

  async getBill(id: string, userId: string, referenceDate = new Date()) {
    const row = await this.creditCardRepository.findByIdWithBankAccount(id, userId);

    if (!row) {
      throw new Error("Cartão não encontrado");
    }

    const { cycleStart, cycleEnd, isCurrentOpenCycle } = getBillingCycle(
      row.creditCard.closingDay,
      referenceDate,
    );
    const currentCycleStart = getCurrentBillingCycleStart(row.creditCard.closingDay);
    const currentCycleEnd = getCurrentOpenBillingCycleEnd(row.creditCard.closingDay);
    const [billTransactions, totalSpentCents, currentBillSpentCents, limitUsedCents] =
      await Promise.all([
        this.transactionRepository.listExpensesByCreditCardForCycle(
          userId,
          row.creditCard.id,
          cycleStart,
          cycleEnd,
        ),
        this.transactionRepository.sumExpensesByCreditCardForCycle(
          userId,
          row.creditCard.id,
          cycleStart,
          cycleEnd,
        ),
        isCurrentOpenCycle
          ? Promise.resolve(0)
          : this.transactionRepository.sumExpensesByCreditCardForCurrentCycle(
              userId,
              row.creditCard.id,
              currentCycleStart,
              currentCycleEnd,
            ),
        this.transactionRepository.sumExpensesByCreditCardFromCurrentMonthOnward(
          userId,
          row.creditCard.id,
        ),
      ]);

    const creditCardCurrentBillSpentCents = isCurrentOpenCycle
      ? totalSpentCents
      : currentBillSpentCents;

    return {
      bill: {
        creditCard: serializeCreditCardRow(row, {
          currentBillSpentCents: creditCardCurrentBillSpentCents,
          limitUsedCents,
        }),
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        isCurrentOpenCycle,
        totalSpentCents,
        transactions: billTransactions.map(serializeBillTransaction),
      },
    };
  }

  async getById(id: string, userId: string) {
    const row = await this.creditCardRepository.findByIdWithBankAccount(id, userId);

    if (!row) {
      throw new Error("Cartão não encontrado");
    }

    const currentCycleStart = getCurrentBillingCycleStart(row.creditCard.closingDay);
    const currentCycleEnd = getCurrentOpenBillingCycleEnd(row.creditCard.closingDay);
    const [currentBillSpentCents, limitUsedCents] = await Promise.all([
      this.transactionRepository.sumExpensesByCreditCardForCurrentCycle(
        userId,
        row.creditCard.id,
        currentCycleStart,
        currentCycleEnd,
      ),
      this.transactionRepository.sumExpensesByCreditCardFromCurrentMonthOnward(
        userId,
        row.creditCard.id,
      ),
    ]);

    return {
      creditCard: serializeCreditCardRow(row, { currentBillSpentCents, limitUsedCents }),
    };
  }

  async create(input: CreateCreditCardInput) {
    const cardCount = await this.creditCardRepository.countByUser(input.userId);

    if (cardCount >= MAX_CARDS_PER_USER) {
      throw new Error("Limite de 30 cartões atingido");
    }

    const lastFourDigits = this.normalizeLastFourDigits(input.lastFourDigits);
    const brandName = this.resolveBrandName(input.brand, input.brandName);
    await this.validateBankAccount(input.bankAccountId, input.userId);
    this.validateColor(input.color);

    const card = await this.creditCardRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      lastFourDigits,
      brand: input.brand,
      brandName,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      bankAccountId: input.bankAccountId,
      creditLimitCents: input.creditLimitCents ?? null,
      color: input.color,
      isActive: true,
      isBlocked: false,
    });

    const row = await this.creditCardRepository.findByIdWithBankAccount(card.id, input.userId);

    if (!row) {
      throw new Error("Cartão não encontrado");
    }

    return { creditCard: serializeCreditCardRow(row) };
  }

  async update(input: UpdateCreditCardInput) {
    const existing = await this.creditCardRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new Error("Cartão não encontrado");
    }

    const brand = input.brand ?? existing.brand;
    const brandName =
      input.brandName !== undefined
        ? this.resolveBrandName(brand, input.brandName ?? undefined)
        : brand !== existing.brand
          ? this.resolveBrandName(brand, undefined)
          : existing.brandName;

    if (input.bankAccountId !== undefined) {
      await this.validateBankAccount(input.bankAccountId, input.userId);
    }

    if (input.color !== undefined) {
      this.validateColor(input.color);
    }

    const card = await this.creditCardRepository.update(input.id, input.userId, {
      name: input.name?.trim(),
      lastFourDigits:
        input.lastFourDigits !== undefined
          ? this.normalizeLastFourDigits(input.lastFourDigits)
          : undefined,
      brand: input.brand,
      brandName,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      bankAccountId: input.bankAccountId,
      creditLimitCents: input.creditLimitCents,
      color: input.color,
      isActive: input.isActive,
      isBlocked: input.isBlocked,
    });

    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    const row = await this.creditCardRepository.findByIdWithBankAccount(card.id, input.userId);

    if (!row) {
      throw new Error("Cartão não encontrado");
    }

    return { creditCard: serializeCreditCardRow(row) };
  }

  async assertCanReceiveTransactions(id: string, userId: string) {
    const card = await this.creditCardRepository.findById(id, userId);

    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    if (!card.isActive) {
      throw new Error("Cartão arquivado não aceita transações");
    }

    if (card.isBlocked) {
      throw new Error("Cartão bloqueado não aceita novas transações");
    }
  }

  async delete(id: string, userId: string) {
    const hasLinkedTransactions = await this.transactionRepository.countByCreditCardId(id);

    if (hasLinkedTransactions > 0) {
      throw new Error("Este cartão possui transações vinculadas. Arquive-o em vez de excluir.");
    }

    const deleted = await this.creditCardRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Cartão não encontrado");
    }
  }

  private async validateBankAccount(bankAccountId: string, userId: string) {
    const account = await this.bankAccountRepository.findById(bankAccountId, userId);

    if (!account) {
      throw new Error("Conta bancária não encontrada");
    }

    if (!account.isActive) {
      throw new Error("Selecione uma conta bancária ativa para pagamento da fatura");
    }
  }

  private normalizeLastFourDigits(value: string): string {
    const trimmed = value.trim();

    if (!/^\d{4}$/.test(trimmed)) {
      throw new Error("Informe exatamente 4 dígitos numéricos");
    }

    return trimmed;
  }

  private validateColor(color: string) {
    if (!isValidCategoryColor(color)) {
      throw new Error("Cor inválida");
    }
  }

  private resolveBrandName(brand: CreditCardBrand, brandName?: string): string | null {
    if (brand === "other") {
      const trimmed = brandName?.trim();

      if (!trimmed) {
        throw new Error("Nome da bandeira é obrigatório quando selecionar Outra");
      }

      return trimmed;
    }

    if (brandName?.trim()) {
      throw new Error("Nome da bandeira só é permitido quando selecionar Outra");
    }

    return null;
  }
}

function serializeBillTransaction(transaction: {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}) {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date.toISOString(),
    category: transaction.category?.id
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          icon: transaction.category.icon,
          color: transaction.category.color,
        }
      : undefined,
  };
}

function serializeCreditCardRow(
  row: CreditCardWithBankAccount,
  extras?: {
    currentBillSpentCents?: number;
    limitUsedCents?: number;
  },
) {
  const { creditCard, bankAccount } = row;
  const currentBillSpentCents = extras?.currentBillSpentCents ?? 0;
  const limitUsedCents = extras?.limitUsedCents ?? currentBillSpentCents;

  return {
    id: creditCard.id,
    name: creditCard.name,
    lastFourDigits: creditCard.lastFourDigits,
    brand: creditCard.brand,
    brandName: creditCard.brandName,
    closingDay: creditCard.closingDay,
    dueDay: creditCard.dueDay,
    bankAccountId: creditCard.bankAccountId,
    creditLimitCents: creditCard.creditLimitCents,
    currentBillSpentCents,
    limitUsedCents,
    bankAccount: {
      id: bankAccount.id,
      name: bankAccount.name,
      bank: bankAccount.bank,
      bankName: bankAccount.bankName,
      isActive: bankAccount.isActive,
    },
    isActive: creditCard.isActive,
    isBlocked: creditCard.isBlocked,
    color: creditCard.color,
    createdAt: creditCard.createdAt.toISOString(),
    updatedAt: creditCard.updatedAt.toISOString(),
  };
}

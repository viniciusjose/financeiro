import type { BankAccountRepository } from "@/repositories/bank-account.repository.js";
import type { CreditCardRepository } from "@/repositories/credit-card.repository.js";

const MAX_ACCOUNTS_PER_USER = 50;

type BankInstitution = "itau" | "sofisa" | "nubank" | "inter" | "other";
type BankAccountType = "checking" | "savings" | "investment" | "wallet";

export interface CreateBankAccountInput {
  userId: string;
  name: string;
  bank: BankInstitution;
  bankName?: string;
  type: BankAccountType;
  initialBalance?: number;
  isDefault?: boolean;
}

export interface UpdateBankAccountInput {
  id: string;
  userId: string;
  name?: string;
  bank?: BankInstitution;
  bankName?: string | null;
  type?: BankAccountType;
  initialBalance?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export class BankAccountService {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly creditCardRepository: CreditCardRepository,
  ) {}

  async list(userId: string, includeInactive: boolean) {
    const accounts = await this.bankAccountRepository.list({ userId, includeInactive });
    return { accounts: accounts.map(serializeAccount) };
  }

  async getById(id: string, userId: string) {
    const account = await this.bankAccountRepository.findById(id, userId);

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    return { account: serializeAccount(account) };
  }

  async create(input: CreateBankAccountInput) {
    const accountCount = await this.bankAccountRepository.countByUser(input.userId);

    if (accountCount >= MAX_ACCOUNTS_PER_USER) {
      throw new Error("Limite de 50 contas atingido");
    }

    const bankName = this.resolveBankName(input.bank, input.bankName);
    const isFirstAccount = accountCount === 0;
    const isDefault = isFirstAccount ? true : (input.isDefault ?? false);

    if (isDefault) {
      await this.bankAccountRepository.clearDefaultForUser(input.userId);
    }

    const account = await this.bankAccountRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      bank: input.bank,
      bankName,
      type: input.type,
      initialBalance: input.initialBalance ?? 0,
      currency: "BRL",
      isDefault,
      isActive: true,
    });

    return { account: serializeAccount(account) };
  }

  async update(input: UpdateBankAccountInput) {
    const existing = await this.bankAccountRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new Error("Conta não encontrada");
    }

    const bank = input.bank ?? existing.bank;
    const bankName =
      input.bankName !== undefined
        ? this.resolveBankName(bank, input.bankName ?? undefined)
        : bank !== existing.bank
          ? this.resolveBankName(bank, undefined)
          : existing.bankName;

    let isDefault = input.isDefault ?? existing.isDefault;
    const isActive = input.isActive ?? existing.isActive;

    if (isActive === false && existing.isDefault) {
      isDefault = false;
    }

    if (isDefault) {
      await this.bankAccountRepository.clearDefaultForUser(input.userId, input.id);
    }

    const account = await this.bankAccountRepository.update(input.id, input.userId, {
      name: input.name?.trim(),
      bank: input.bank,
      bankName,
      type: input.type,
      initialBalance: input.initialBalance,
      isDefault,
      isActive,
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    return { account: serializeAccount(account) };
  }

  async delete(id: string, userId: string) {
    const existing = await this.bankAccountRepository.findById(id, userId);

    if (!existing) {
      throw new Error("Conta não encontrada");
    }

    const linkedCards = await this.creditCardRepository.countByBankAccountId(id);

    if (linkedCards > 0) {
      throw new Error(
        "Não é possível excluir conta com cartões vinculados. Arquive a conta ou altere os cartões.",
      );
    }

    const deleted = await this.bankAccountRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Conta não encontrada");
    }
  }

  private resolveBankName(bank: BankInstitution, bankName?: string): string | null {
    if (bank === "other") {
      const trimmed = bankName?.trim();

      if (!trimmed) {
        throw new Error("Nome do banco é obrigatório quando selecionar Outro");
      }

      return trimmed;
    }

    if (bankName?.trim()) {
      throw new Error("Nome do banco só é permitido quando selecionar Outro");
    }

    return null;
  }
}

function serializeAccount(account: {
  id: string;
  name: string;
  bank: BankInstitution;
  bankName: string | null;
  type: BankAccountType;
  initialBalance: number;
  currency: string;
  color: string | null;
  lastFourDigits: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: account.id,
    name: account.name,
    bank: account.bank,
    bankName: account.bankName,
    type: account.type,
    initialBalance: account.initialBalance,
    currency: account.currency as "BRL",
    color: account.color,
    lastFourDigits: account.lastFourDigits,
    isDefault: account.isDefault,
    isActive: account.isActive,
    notes: account.notes,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

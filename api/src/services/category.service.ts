import { isAllowedCategoryIcon, isValidCategoryColor } from "@/lib/category-icons.js";
import type { CategoryRepository } from "@/repositories/category.repository.js";
import type { TransactionRepository } from "@/repositories/transaction.repository.js";

const MAX_ACTIVE_CATEGORIES = 100;

export const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "UtensilsCrossed", color: "#E85D4C", type: "expense" as const },
  { name: "Transporte", icon: "Car", color: "#3B82F6", type: "expense" as const },
  { name: "Moradia", icon: "Home", color: "#8B5CF6", type: "expense" as const },
  { name: "Saúde", icon: "HeartPulse", color: "#10B981", type: "expense" as const },
  { name: "Lazer", icon: "Gamepad2", color: "#F59E0B", type: "expense" as const },
  { name: "Compras", icon: "ShoppingBag", color: "#EC4899", type: "expense" as const },
  { name: "Educação", icon: "GraduationCap", color: "#6366F1", type: "expense" as const },
  { name: "Contas e serviços", icon: "Receipt", color: "#64748B", type: "expense" as const },
  { name: "Outros", icon: "MoreHorizontal", color: "#94A3B8", type: "expense" as const },
  { name: "Salário", icon: "Briefcase", color: "#10B981", type: "income" as const },
  { name: "Freelance", icon: "Laptop", color: "#3B82F6", type: "income" as const },
  { name: "Investimentos", icon: "TrendingUp", color: "#8B5CF6", type: "income" as const },
  { name: "Presente / reembolso", icon: "Gift", color: "#F59E0B", type: "income" as const },
  { name: "Outros", icon: "MoreHorizontal", color: "#94A3B8", type: "income" as const },
];

export type CategoryType = "expense" | "income" | "both";

export interface CreateCategoryInput {
  userId: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  type: CategoryType;
  spendingLimitCents?: number | null;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  id: string;
  userId: string;
  name?: string;
  description?: string | null;
  icon?: string;
  color?: string;
  type?: CategoryType;
  spendingLimitCents?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async list(userId: string, type?: CategoryType, includeInactive = false) {
    await this.ensureDefaults(userId);

    const items = await this.categoryRepository.list({ userId, type, includeInactive });
    const budgetedExpenseCategoryIds = items
      .filter((category) => category.type === "expense" && category.spendingLimitCents != null)
      .map((category) => category.id);
    const spentByCategory =
      await this.transactionRepository.sumExpensesByCategoryIdsForCurrentMonth(
        userId,
        budgetedExpenseCategoryIds,
      );

    return {
      categories: items.map((category) =>
        serializeCategory(category, {
          monthSpentCents:
            category.type === "expense" && category.spendingLimitCents != null
              ? (spentByCategory.get(category.id) ?? 0)
              : null,
        }),
      ),
    };
  }

  async getById(id: string, userId: string) {
    const category = await this.categoryRepository.findById(id, userId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    return { category: serializeCategory(category) };
  }

  async create(input: CreateCategoryInput) {
    this.validateIconAndColor(input.icon, input.color);

    const activeCount = await this.categoryRepository.countActiveByUser(input.userId);

    if (activeCount >= MAX_ACTIVE_CATEGORIES) {
      throw new Error("Limite de 100 categorias ativas atingido");
    }

    const category = await this.categoryRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      icon: input.icon,
      color: input.color,
      type: input.type,
      spendingLimitCents: resolveSpendingLimitCents(input.type, input.spendingLimitCents),
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });

    return { category: serializeCategory(category) };
  }

  async update(input: UpdateCategoryInput) {
    const existing = await this.categoryRepository.findById(input.id, input.userId);

    if (!existing) {
      throw new Error("Categoria não encontrada");
    }

    if (input.icon !== undefined || input.color !== undefined) {
      this.validateIconAndColor(input.icon ?? existing.icon, input.color ?? existing.color);
    }

    if (input.type !== undefined && input.type !== existing.type) {
      const incompatibleCount = await this.categoryRepository.countIncompatibleTransactions(
        input.id,
        input.type,
      );

      if (incompatibleCount > 0) {
        throw new Error(
          `Não é possível alterar o tipo: ${incompatibleCount} transação(ões) ficariam incompatíveis`,
        );
      }
    }

    const effectiveType = input.type ?? existing.type;
    const spendingLimitCents = resolveSpendingLimitCentsForUpdate(
      effectiveType,
      existing.type,
      input.type,
      input.spendingLimitCents,
    );

    const category = await this.categoryRepository.update(input.id, input.userId, {
      name: input.name?.trim(),
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      icon: input.icon,
      color: input.color,
      type: input.type,
      spendingLimitCents,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    return { category: serializeCategory(category) };
  }

  async delete(id: string, userId: string) {
    const existing = await this.categoryRepository.findById(id, userId);

    if (!existing) {
      throw new Error("Categoria não encontrada");
    }

    const hasLinkedTransactions = await this.categoryRepository.hasTransactions(id);

    if (hasLinkedTransactions) {
      throw new CategoryDeleteConflictError(
        "Esta categoria possui transações vinculadas. Arquive-a em vez de excluir.",
      );
    }

    const deleted = await this.categoryRepository.delete(id, userId);

    if (!deleted) {
      throw new Error("Categoria não encontrada");
    }
  }

  async validateCategoryForTransaction(
    categoryId: string,
    userId: string,
    transactionType: "income" | "expense",
  ) {
    const category = await this.categoryRepository.findById(categoryId, userId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    if (!category.isActive) {
      throw new Error("Categoria arquivada não pode ser usada em novas transações");
    }

    if (category.type !== "both" && category.type !== transactionType) {
      throw new Error("Categoria incompatível com o tipo da transação");
    }

    return category;
  }

  async ensureDefaults(userId: string) {
    const total = await this.categoryRepository.countByUser(userId);

    if (total > 0) {
      return;
    }

    await this.categoryRepository.createMany(
      DEFAULT_CATEGORIES.map((preset, index) => ({
        userId,
        name: preset.name,
        description: null,
        icon: preset.icon,
        color: preset.color,
        type: preset.type,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  private validateIconAndColor(icon: string, color: string) {
    if (!isAllowedCategoryIcon(icon)) {
      throw new Error("Ícone não permitido");
    }

    if (!isValidCategoryColor(color)) {
      throw new Error("Cor inválida");
    }
  }
}

export class CategoryDeleteConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryDeleteConflictError";
  }
}

function resolveSpendingLimitCents(type: CategoryType, spendingLimitCents?: number | null) {
  if (type !== "expense") {
    return null;
  }

  return spendingLimitCents ?? null;
}

function resolveSpendingLimitCentsForUpdate(
  effectiveType: CategoryType,
  existingType: CategoryType,
  inputType: CategoryType | undefined,
  spendingLimitCents: number | null | undefined,
) {
  if (effectiveType !== "expense") {
    if (inputType !== undefined && inputType !== existingType) {
      return null;
    }

    if (spendingLimitCents !== undefined) {
      return null;
    }

    return undefined;
  }

  if (spendingLimitCents !== undefined) {
    return spendingLimitCents;
  }

  return undefined;
}

function serializeCategory(
  category: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    type: CategoryType;
    spendingLimitCents: number | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  extras?: {
    monthSpentCents?: number | null;
  },
) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    type: category.type,
    spendingLimitCents: category.spendingLimitCents,
    monthSpentCents: extras?.monthSpentCents ?? null,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

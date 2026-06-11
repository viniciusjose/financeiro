import { z } from "zod";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/category-display";
import { CATEGORY_COLOR_HEXES } from "@/lib/category-colors";
import { CATEGORY_ICON_ALLOWLIST } from "@/lib/category-icons";
import { brlInputSchema, parseBrlInput } from "@/lib/money";

const categoryTypeSchema = z.enum(["expense", "income", "both"]);

const categoryBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório")
      .max(
        CATEGORY_NAME_MAX_LENGTH,
        `Nome deve ter no máximo ${CATEGORY_NAME_MAX_LENGTH} caracteres`,
      ),
    description: z
      .string()
      .trim()
      .max(200, "Descrição deve ter no máximo 200 caracteres")
      .optional(),
    icon: z
      .string()
      .refine(
        (value) => (CATEGORY_ICON_ALLOWLIST as readonly string[]).includes(value),
        "Ícone inválido",
      ),
    color: z
      .string()
      .refine(
        (value) => (CATEGORY_COLOR_HEXES as readonly string[]).includes(value),
        "Cor inválida",
      ),
    type: categoryTypeSchema,
    spendingLimit: brlInputSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "expense" && data.spendingLimit?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Orçamento mensal só é permitido para categorias de despesa",
        path: ["spendingLimit"],
      });
      return;
    }

    if (data.type === "expense" && data.spendingLimit?.trim()) {
      const cents = parseBrlInput(data.spendingLimit);

      if (cents === null || cents <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um valor maior que zero",
          path: ["spendingLimit"],
        });
      }
    }
  });

export const createCategorySchema = categoryBaseSchema;

export const updateCategorySchema = categoryBaseSchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

function toApiSpendingLimitCents(type: CategoryType, value?: string) {
  if (type !== "expense" || !value?.trim()) {
    return null;
  }

  const cents = parseBrlInput(value);

  if (cents === null || cents <= 0) {
    throw new Error("Orçamento mensal inválido");
  }

  return cents;
}

export function toApiCreatePayload(values: CreateCategoryInput) {
  return {
    name: values.name,
    description: values.description?.trim() || null,
    icon: values.icon,
    color: values.color,
    type: values.type,
    spendingLimitCents: toApiSpendingLimitCents(values.type, values.spendingLimit),
  };
}

export function toApiUpdatePayload(values: UpdateCategoryInput) {
  return {
    name: values.name,
    description: values.description?.trim() || null,
    icon: values.icon,
    color: values.color,
    type: values.type,
    spendingLimitCents: toApiSpendingLimitCents(values.type, values.spendingLimit),
    isActive: values.isActive,
  };
}

export const CATEGORY_TYPE_LABELS = {
  expense: "Despesa",
  income: "Receita",
  both: "Ambos",
} as const;

export type CategoryType = keyof typeof CATEGORY_TYPE_LABELS;

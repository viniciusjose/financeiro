import { z } from "zod";
import { CATEGORY_ICON_ALLOWLIST, isValidCategoryColor } from "@/lib/category-icons.js";
import { positiveMoneyCentsSchema } from "@/lib/money.js";

const CATEGORY_NAME_MAX_LENGTH = 24;

const categoryTypeSchema = z.enum(["expense", "income", "both"]);

const iconSchema = z
  .string()
  .min(1, "Ícone é obrigatório")
  .max(50, "Ícone inválido")
  .refine(
    (value) => (CATEGORY_ICON_ALLOWLIST as readonly string[]).includes(value),
    "Ícone não permitido",
  );

const colorSchema = z.string().refine(isValidCategoryColor, "Cor deve estar no formato #RRGGBB");

const categoryFieldsSchema = z.object({
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
    .optional()
    .nullable(),
  icon: iconSchema,
  color: colorSchema,
  type: categoryTypeSchema,
  spendingLimitCents: positiveMoneyCentsSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function refineSpendingLimit(
  data: {
    type?: z.infer<typeof categoryTypeSchema>;
    spendingLimitCents?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.spendingLimitCents != null && data.type != null && data.type !== "expense") {
    ctx.addIssue({
      code: "custom",
      message: "Limite mensal só é permitido para categorias de despesa",
      path: ["spendingLimitCents"],
    });
  }
}

const categoryBodySchema = categoryFieldsSchema.superRefine(refineSpendingLimit);

export const listCategoriesSchema = {
  querystring: z.object({
    type: categoryTypeSchema.optional(),
    includeInactive: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  }),
};

export const categoryIdSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
};

export const createCategorySchema = {
  body: categoryBodySchema,
};

export const updateCategorySchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: categoryFieldsSchema
    .partial()
    .extend({
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, "Nenhum campo para atualizar")
    .superRefine(refineSpendingLimit),
};

import { z } from "zod";
import { isValidCategoryColor } from "@/lib/category-icons.js";
import { positiveMoneyCentsSchema } from "@/lib/money.js";

const colorSchema = z.string().refine(isValidCategoryColor, "Cor inválida");

const creditCardBrandSchema = z.enum([
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "diners",
  "other",
]);

const dayOfMonthSchema = z
  .number()
  .int("Dia deve ser um número inteiro")
  .min(1, "Dia deve ser entre 1 e 31")
  .max(31, "Dia deve ser entre 1 e 31");

const lastFourDigitsSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Informe exatamente 4 dígitos numéricos");

const creditCardBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Descrição é obrigatória")
      .max(80, "Descrição deve ter no máximo 80 caracteres"),
    lastFourDigits: lastFourDigitsSchema,
    brand: creditCardBrandSchema,
    brandName: z
      .string()
      .trim()
      .min(1, "Nome da bandeira é obrigatório")
      .max(80, "Nome da bandeira deve ter no máximo 80 caracteres")
      .optional(),
    closingDay: dayOfMonthSchema,
    dueDay: dayOfMonthSchema,
    bankAccountId: z.string().uuid("Conta bancária inválida"),
    creditLimitCents: positiveMoneyCentsSchema.nullable().optional(),
    color: colorSchema,
  })
  .superRefine((data, ctx) => {
    if (data.brand === "other") {
      if (!data.brandName?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Nome da bandeira é obrigatório quando selecionar Outra",
          path: ["brandName"],
        });
      }
    } else if (data.brandName !== undefined && data.brandName.trim().length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Nome da bandeira só é permitido quando selecionar Outra",
        path: ["brandName"],
      });
    }
  });

export const listCreditCardsSchema = {
  querystring: z.object({
    includeInactive: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  }),
};

export const creditCardIdSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
};

export const getCreditCardBillSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  querystring: z.object({
    referenceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de referência inválida")
      .optional(),
  }),
};

export const createCreditCardSchema = {
  body: creditCardBodySchema,
};

export const updateCreditCardSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      lastFourDigits: lastFourDigitsSchema.optional(),
      brand: creditCardBrandSchema.optional(),
      brandName: z.string().trim().min(1).max(80).optional().nullable(),
      closingDay: dayOfMonthSchema.optional(),
      dueDay: dayOfMonthSchema.optional(),
      bankAccountId: z.string().uuid("Conta bancária inválida").optional(),
      creditLimitCents: positiveMoneyCentsSchema.nullable().optional(),
      color: colorSchema.optional(),
      isActive: z.boolean().optional(),
      isBlocked: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.brand === "other") {
        if (!data.brandName?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Nome da bandeira é obrigatório quando selecionar Outra",
            path: ["brandName"],
          });
        }
      } else if (
        data.brand !== undefined &&
        data.brandName !== undefined &&
        data.brandName !== null
      ) {
        if (data.brandName.trim().length > 0) {
          ctx.addIssue({
            code: "custom",
            message: "Nome da bandeira só é permitido quando selecionar Outra",
            path: ["brandName"],
          });
        }
      }
    }),
};

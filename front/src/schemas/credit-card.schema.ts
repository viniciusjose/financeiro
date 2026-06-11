import { z } from "zod";
import { CREDIT_CARD_BRANDS } from "@/lib/card-brands";
import { CATEGORY_COLOR_HEXES, CATEGORY_COLOR_PALETTE } from "@/lib/category-colors";
import { brlInputSchema, formatCentsAsBrlInput, parseBrlInput } from "@/lib/money";
import type { CreditCard } from "@/services/credit-cards";

const dayOfMonthSchema = z
  .number()
  .int("Dia deve ser um número inteiro")
  .min(1, "Dia deve ser entre 1 e 31")
  .max(31, "Dia deve ser entre 1 e 31");

const creditCardBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Descrição é obrigatória")
      .max(80, "Descrição deve ter no máximo 80 caracteres"),
    lastFourDigits: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Informe exatamente 4 dígitos numéricos"),
    brand: z.enum(CREDIT_CARD_BRANDS),
    brandName: z
      .string()
      .trim()
      .max(80, "Nome da bandeira deve ter no máximo 80 caracteres")
      .optional(),
    closingDay: dayOfMonthSchema,
    dueDay: dayOfMonthSchema,
    bankAccountId: z.string().uuid("Selecione uma conta bancária"),
    creditLimit: brlInputSchema.optional(),
    color: z
      .string()
      .refine(
        (value) => (CATEGORY_COLOR_HEXES as readonly string[]).includes(value),
        "Cor inválida",
      ),
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
    } else if (data.brandName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Nome da bandeira só é permitido quando selecionar Outra",
        path: ["brandName"],
      });
    }

    if (data.creditLimit?.trim()) {
      const cents = parseBrlInput(data.creditLimit);

      if (cents === null || cents <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um limite maior que zero",
          path: ["creditLimit"],
        });
      }
    }
  });

export const createCreditCardSchema = creditCardBaseSchema;

export const updateCreditCardSchema = creditCardBaseSchema;

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;

function toApiCreditLimitCents(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const cents = parseBrlInput(value);

  if (cents === null || cents <= 0) {
    throw new Error("Limite do cartão inválido");
  }

  return cents;
}

export function toApiCreatePayload(values: CreateCreditCardInput) {
  return {
    name: values.name,
    lastFourDigits: values.lastFourDigits,
    brand: values.brand,
    brandName: values.brand === "other" ? values.brandName : undefined,
    closingDay: values.closingDay,
    dueDay: values.dueDay,
    bankAccountId: values.bankAccountId,
    creditLimitCents: toApiCreditLimitCents(values.creditLimit),
    color: values.color,
  };
}

export function creditCardToUpdateInput(
  creditCard: CreditCard,
  overrides?: Partial<UpdateCreditCardInput>,
): UpdateCreditCardInput {
  return {
    name: creditCard.name,
    lastFourDigits: creditCard.lastFourDigits,
    brand: creditCard.brand,
    brandName: creditCard.brandName ?? "",
    closingDay: creditCard.closingDay,
    dueDay: creditCard.dueDay,
    bankAccountId: creditCard.bankAccountId,
    creditLimit:
      creditCard.creditLimitCents != null
        ? formatCentsAsBrlInput(creditCard.creditLimitCents)
        : "",
    color: creditCard.color ?? CATEGORY_COLOR_PALETTE[10].hex,
    isActive: creditCard.isActive,
    isBlocked: creditCard.isBlocked,
    ...overrides,
  };
}

export function toApiUpdatePayload(values: UpdateCreditCardInput) {
  return {
    name: values.name,
    lastFourDigits: values.lastFourDigits,
    brand: values.brand,
    brandName: values.brand === "other" ? values.brandName : null,
    closingDay: values.closingDay,
    dueDay: values.dueDay,
    bankAccountId: values.bankAccountId,
    creditLimitCents: toApiCreditLimitCents(values.creditLimit),
    color: values.color,
    isActive: values.isActive,
    isBlocked: values.isBlocked,
  };
}

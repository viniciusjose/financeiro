import { z } from "zod";
import { BANK_ACCOUNT_TYPES, BANK_INSTITUTIONS } from "@/lib/bank-logos";
import { brlInputSchema, parseBrlInput } from "@/lib/money";

const bankAccountBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório")
      .max(80, "Nome deve ter no máximo 80 caracteres"),
    bank: z.enum(BANK_INSTITUTIONS),
    bankName: z
      .string()
      .trim()
      .max(80, "Nome do banco deve ter no máximo 80 caracteres")
      .optional(),
    type: z.enum(BANK_ACCOUNT_TYPES),
    initialBalance: brlInputSchema.optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.bank === "other") {
      if (!data.bankName?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Nome do banco é obrigatório quando selecionar Outro",
          path: ["bankName"],
        });
      }
    } else if (data.bankName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Nome do banco só é permitido quando selecionar Outro",
        path: ["bankName"],
      });
    }
  });

export const createBankAccountSchema = bankAccountBaseSchema;

export const updateBankAccountSchema = bankAccountBaseSchema;

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

function toApiBalanceCents(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  return parseBrlInput(value) ?? undefined;
}

export function toApiCreatePayload(values: CreateBankAccountInput) {
  return {
    name: values.name,
    bank: values.bank,
    bankName: values.bank === "other" ? values.bankName : undefined,
    type: values.type,
    initialBalance: toApiBalanceCents(values.initialBalance),
    isDefault: values.isDefault,
  };
}

export function toApiUpdatePayload(values: UpdateBankAccountInput) {
  return {
    name: values.name,
    bank: values.bank,
    bankName: values.bank === "other" ? values.bankName : null,
    type: values.type,
    initialBalance: toApiBalanceCents(values.initialBalance),
    isDefault: values.isDefault,
    isActive: values.isActive,
  };
}

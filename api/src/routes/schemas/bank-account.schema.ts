import { z } from "zod";
import { moneyCentsSchema } from "@/lib/money.js";

const bankInstitutionSchema = z.enum(["itau", "sofisa", "nubank", "inter", "other"]);
const bankAccountTypeSchema = z.enum(["checking", "savings", "investment", "wallet"]);

const bankAccountBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório")
      .max(80, "Nome deve ter no máximo 80 caracteres"),
    bank: bankInstitutionSchema,
    bankName: z
      .string()
      .trim()
      .min(1, "Nome do banco é obrigatório")
      .max(80, "Nome do banco deve ter no máximo 80 caracteres")
      .optional(),
    type: bankAccountTypeSchema,
    initialBalance: moneyCentsSchema.optional(),
    isDefault: z.boolean().optional(),
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
    } else if (data.bankName !== undefined && data.bankName.trim().length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Nome do banco só é permitido quando selecionar Outro",
        path: ["bankName"],
      });
    }
  });

export const listBankAccountsSchema = {
  querystring: z.object({
    includeInactive: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  }),
};

export const bankAccountIdSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
};

export const createBankAccountSchema = {
  body: bankAccountBodySchema,
};

export const updateBankAccountSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      bank: bankInstitutionSchema.optional(),
      bankName: z.string().trim().min(1).max(80).optional().nullable(),
      type: bankAccountTypeSchema.optional(),
      initialBalance: moneyCentsSchema.optional(),
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
      } else if (data.bank !== undefined && data.bankName !== undefined && data.bankName !== null) {
        if (data.bankName.trim().length > 0) {
          ctx.addIssue({
            code: "custom",
            message: "Nome do banco só é permitido quando selecionar Outro",
            path: ["bankName"],
          });
        }
      }
    }),
};

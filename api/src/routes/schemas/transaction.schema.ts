import { z } from "zod";

export const listTransactionsSchema = {
  querystring: z.object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(10),
  }),
};

export const transactionIdSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
};

export const createTransactionSchema = {
  body: z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido")
      .refine((value) => Number(value) > 0, "Valor deve ser maior que zero"),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, "Categoria é obrigatória"),
    date: z.string().datetime("Data inválida"),
  }),
};

export const updateTransactionSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: z.object({
    description: z.string().min(1).optional(),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .refine((value) => Number(value) > 0)
      .optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(1).optional(),
    date: z.string().datetime().optional(),
  }),
};

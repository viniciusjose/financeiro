import { z } from "zod";
import { positiveMoneyCentsSchema } from "@/lib/money.js";

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
    amount: positiveMoneyCentsSchema,
    type: z.enum(["income", "expense"]),
    categoryId: z.string().uuid("Categoria inválida").optional().nullable(),
    creditCardId: z.string().uuid("Cartão inválido").optional().nullable(),
    date: z.string().datetime("Data inválida"),
  }),
};

export const updateTransactionSchema = {
  params: z.object({
    id: z.string().uuid("ID inválido"),
  }),
  body: z.object({
    description: z.string().min(1).optional(),
    amount: positiveMoneyCentsSchema.optional(),
    type: z.enum(["income", "expense"]).optional(),
    categoryId: z.string().uuid("Categoria inválida").optional().nullable(),
    creditCardId: z.string().uuid("Cartão inválido").optional().nullable(),
    date: z.string().datetime().optional(),
  }),
};

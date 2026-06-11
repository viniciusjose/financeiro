import { z } from "zod";
import { brlInputSchema, parseBrlInput } from "@/lib/money";

export const createTransactionSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  amount: brlInputSchema.refine((value) => value.trim() !== "" && parseBrlInput(value) !== null, {
    message: "Valor é obrigatório",
  }),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid("Categoria inválida").nullable().optional(),
  creditCardId: z.string().uuid("Cartão inválido").nullable().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data é obrigatória")
    .min(1, "Data é obrigatória"),
});

export const updateTransactionSchema = createTransactionSchema;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

function toIsoDateTime(date: string) {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

export function toApiCreatePayload(values: CreateTransactionInput) {
  const amount = parseBrlInput(values.amount);

  if (amount === null) {
    throw new Error("Valor inválido");
  }

  return {
    description: values.description,
    amount,
    type: values.type,
    categoryId: values.categoryId ?? null,
    creditCardId: values.type === "expense" ? (values.creditCardId ?? null) : null,
    date: toIsoDateTime(values.date),
  };
}

export function toApiUpdatePayload(values: UpdateTransactionInput) {
  return toApiCreatePayload(values);
}

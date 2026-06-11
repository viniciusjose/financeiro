import { z } from "zod";
import { brlInputSchema, parseBrlInput } from "@/lib/money";

export const transactionModeSchema = z.enum(["single", "installment", "recurring"]);
export type TransactionMode = z.infer<typeof transactionModeSchema>;

export const applyScopeSchema = z.enum(["only_this", "this_and_future"]);
export type ApplyScope = z.infer<typeof applyScopeSchema>;

export const createTransactionSchema = z
  .object({
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
    mode: transactionModeSchema,
    recurrenceCount: z.number().int().optional(),
  })
  .superRefine((values, context) => {
    if (values.mode === "single") {
      return;
    }

    if (values.recurrenceCount == null || Number.isNaN(values.recurrenceCount)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrenceCount"],
        message:
          values.mode === "installment"
            ? "Número de parcelas é obrigatório"
            : "Quantidade de meses é obrigatória",
      });
      return;
    }

    if (values.recurrenceCount < 2 || values.recurrenceCount > 48) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrenceCount"],
        message: "Quantidade deve ser entre 2 e 48",
      });
    }
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

  const payload: {
    description: string;
    amount: number;
    type: "income" | "expense";
    categoryId: string | null;
    creditCardId: string | null;
    date: string;
    recurrence?: {
      kind: "installment" | "recurring";
      totalOccurrences: number;
    };
  } = {
    description: values.description,
    amount,
    type: values.type,
    categoryId: values.categoryId ?? null,
    creditCardId: values.type === "expense" ? (values.creditCardId ?? null) : null,
    date: toIsoDateTime(values.date),
  };

  if (values.mode === "installment" && values.recurrenceCount) {
    payload.recurrence = {
      kind: "installment",
      totalOccurrences: values.recurrenceCount,
    };
  }

  if (values.mode === "recurring" && values.recurrenceCount) {
    payload.recurrence = {
      kind: "recurring",
      totalOccurrences: values.recurrenceCount,
    };
  }

  return payload;
}

export function toApiUpdatePayload(values: UpdateTransactionInput, applyScope?: ApplyScope) {
  const payload = toApiCreatePayload(values) as ReturnType<typeof toApiCreatePayload> & {
    applyScope?: ApplyScope;
    recurrence?: undefined;
  };

  delete payload.recurrence;

  if (applyScope) {
    payload.applyScope = applyScope;
  }

  return payload;
}

export function getAmountLabel(mode: TransactionMode, isEditing: boolean) {
  if (isEditing) {
    return "Valor";
  }

  if (mode === "installment") {
    return "Valor total";
  }

  if (mode === "recurring") {
    return "Valor mensal";
  }

  return "Valor";
}

export function getRecurrenceCountLabel(mode: TransactionMode) {
  return mode === "installment" ? "Número de parcelas" : "Quantidade de meses";
}

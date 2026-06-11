import { z } from "zod";

/** Limite compatível com numeric(12, 2): até R$ 9.999.999.999,99 */
export const MAX_MONEY_CENTS = 999_999_999_999;
export const MIN_MONEY_CENTS = -MAX_MONEY_CENTS;

export const moneyCentsSchema = z
  .number()
  .int("Valor deve ser inteiro em centavos")
  .min(MIN_MONEY_CENTS, "Valor abaixo do limite permitido")
  .max(MAX_MONEY_CENTS, "Valor acima do limite permitido");

export const positiveMoneyCentsSchema = moneyCentsSchema.positive("Valor deve ser maior que zero");

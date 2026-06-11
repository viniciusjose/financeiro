import { z } from "zod";

/** Exibe centavos como moeda BRL (ex.: 150050 → "R$ 1.500,50"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Formata centavos para input editável em pt-BR (ex.: 150050 → "1.500,50"). */
export function formatCentsAsBrlInput(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const reais = Math.floor(absolute / 100);
  const centavos = absolute % 100;
  const formatted = `${reais.toLocaleString("pt-BR")},${String(centavos).padStart(2, "0")}`;

  return negative ? `-${formatted}` : formatted;
}

/** Aplica máscara BRL enquanto o usuário digita (ex.: "10000" → "100,00"). */
export function maskBrlInput(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const cents = Number.parseInt(digits, 10);

  if (!Number.isSafeInteger(cents)) {
    return "";
  }

  return formatCentsAsBrlInput(cents);
}

/** Converte texto digitado em pt-BR para centavos inteiros. Retorna null se inválido. */
export function parseBrlInput(input: string): number | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const negative = trimmed.startsWith("-");
  const normalized = (negative ? trimmed.slice(1) : trimmed).trim();

  if (!normalized) {
    return null;
  }

  const withoutThousands = normalized.replace(/\./g, "");
  const parts = withoutThousands.split(",");

  if (parts.length > 2) {
    return null;
  }

  const integerPart = parts[0]?.replace(/\D/g, "") ?? "";

  if (!integerPart) {
    return null;
  }

  const decimalPart = parts[1] ?? "";

  if (decimalPart && !/^\d{1,2}$/.test(decimalPart)) {
    return null;
  }

  const cents =
    Number.parseInt(integerPart, 10) * 100 + Number.parseInt(decimalPart.padEnd(2, "0"), 10);

  if (!Number.isSafeInteger(cents)) {
    return null;
  }

  return negative ? -cents : cents;
}

export const brlInputSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || parseBrlInput(value) !== null, "Valor inválido")
  .or(z.literal(""));

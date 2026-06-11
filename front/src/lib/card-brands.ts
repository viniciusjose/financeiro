import amexLogo from "@/assets/card-brands/amex.svg";
import dinersLogo from "@/assets/card-brands/diners.svg";
import eloLogo from "@/assets/card-brands/elo.svg";
import hipercardLogo from "@/assets/card-brands/hipercard.svg";
import mastercardLogo from "@/assets/card-brands/mastercard.svg";
import visaLogo from "@/assets/card-brands/visa.svg";

export const CREDIT_CARD_BRANDS = [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "diners",
  "other",
] as const;

export type CreditCardBrand = (typeof CREDIT_CARD_BRANDS)[number];

interface CardBrandMeta {
  label: string;
  alt: string;
  src?: string;
}

export const CARD_BRANDS: Record<CreditCardBrand, CardBrandMeta> = {
  visa: {
    label: "Visa",
    alt: "Bandeira Visa",
    src: visaLogo,
  },
  mastercard: {
    label: "Mastercard",
    alt: "Bandeira Mastercard",
    src: mastercardLogo,
  },
  elo: {
    label: "Elo",
    alt: "Bandeira Elo",
    src: eloLogo,
  },
  amex: {
    label: "American Express",
    alt: "Bandeira American Express",
    src: amexLogo,
  },
  hipercard: {
    label: "Hipercard",
    alt: "Bandeira Hipercard",
    src: hipercardLogo,
  },
  diners: {
    label: "Diners Club",
    alt: "Bandeira Diners Club",
    src: dinersLogo,
  },
  other: {
    label: "Outra",
    alt: "Outra bandeira de cartão",
  },
};

export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function getCardBrandLabel(brand: CreditCardBrand, brandName?: string | null) {
  if (brand === "other") {
    return brandName?.trim() || CARD_BRANDS.other.label;
  }

  return CARD_BRANDS[brand].label;
}

export function formatCardCycle(closingDay: number, dueDay: number) {
  return `Fecha dia ${closingDay} · Vence dia ${dueDay}`;
}

export function formatMaskedCardNumber(lastFourDigits: string) {
  return `••••  ••••  ••••  ${lastFourDigits}`;
}

export function formatDueDayLabel(dueDay: number) {
  return `Todo dia ${dueDay}`;
}

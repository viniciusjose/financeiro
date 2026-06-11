import interLogo from "@/assets/banks/inter.svg";
import itauLogo from "@/assets/banks/itau.svg";
import nubankLogo from "@/assets/banks/nubank.svg";
import sofisaLogo from "@/assets/banks/sofisa.svg";

export const BANK_INSTITUTIONS = ["itau", "sofisa", "nubank", "inter", "other"] as const;

export type BankInstitution = (typeof BANK_INSTITUTIONS)[number];

export const BANK_ACCOUNT_TYPES = ["checking", "savings", "investment", "wallet"] as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export type BankLogoFit = "square" | "wide";

interface BankLogoMeta {
  label: string;
  alt: string;
  src?: string;
  fit: BankLogoFit;
  /** Override default wide dimensions (wordmark com mais detalhe) */
  wideClass?: { sm: string; md: string };
}

export const BANK_LOGOS: Record<BankInstitution, BankLogoMeta> = {
  itau: {
    label: "Itaú",
    alt: "Logo Itaú",
    src: itauLogo,
    fit: "square",
  },
  sofisa: {
    label: "Sofisa",
    alt: "Logo Sofisa",
    src: sofisaLogo,
    fit: "wide",
    wideClass: {
      sm: "h-6 w-[4rem]",
      md: "h-7 w-[4.75rem]",
    },
  },
  nubank: {
    label: "Nubank",
    alt: "Logo Nubank",
    src: nubankLogo,
    fit: "wide",
  },
  inter: {
    label: "Inter",
    alt: "Logo Inter",
    src: interLogo,
    fit: "wide",
    wideClass: {
      sm: "h-10 w-[5.5rem]",
      md: "h-14 w-[7rem]",
    },
  },
  other: {
    label: "Outro",
    alt: "Outra instituição financeira",
    fit: "square",
  },
};

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  investment: "Investimentos",
  wallet: "Carteira digital",
};

export function getBankLabel(bank: BankInstitution, bankName?: string | null) {
  if (bank === "other") {
    return bankName?.trim() || BANK_LOGOS.other.label;
  }

  return BANK_LOGOS[bank].label;
}

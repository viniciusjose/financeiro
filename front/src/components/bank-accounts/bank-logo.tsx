import { Building2 } from "lucide-react";
import { useState } from "react";
import { BANK_LOGOS, type BankInstitution, getBankLabel } from "@/lib/bank-logos";
import { cn } from "@/lib/utils";

const squareSizeClasses = {
  sm: "size-8",
  md: "size-12",
} as const;

const wideSizeClasses = {
  sm: "h-8 w-[5.5rem]",
  md: "h-10 w-[6.75rem]",
} as const;

interface BankLogoProps {
  bank: BankInstitution;
  bankName?: string | null;
  size?: keyof typeof squareSizeClasses;
  className?: string;
}

export function BankLogo({ bank, bankName, size = "sm", className }: BankLogoProps) {
  const [hasError, setHasError] = useState(false);
  const meta = BANK_LOGOS[bank];
  const label = getBankLabel(bank, bankName);
  const dimension =
    meta.wideClass?.[size] ??
    (meta.fit === "wide" ? wideSizeClasses[size] : squareSizeClasses[size]);

  if (!meta.src || hasError || bank === "other") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-canvas-soft text-muted-foreground",
          dimension,
          className,
        )}
        title={label}
      >
        <Building2 className={size === "sm" ? "size-4" : "size-6"} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={meta.src}
      alt={meta.alt}
      className={cn("shrink-0 object-contain object-left", dimension, className)}
      onError={() => setHasError(true)}
    />
  );
}

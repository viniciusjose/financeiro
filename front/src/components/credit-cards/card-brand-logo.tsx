import { CreditCard } from "lucide-react";
import { useState } from "react";
import { CARD_BRANDS, type CreditCardBrand, getCardBrandLabel } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-[3.25rem]",
  md: "h-10 w-[4rem]",
} as const;

interface CardBrandLogoProps {
  brand: CreditCardBrand;
  brandName?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function CardBrandLogo({ brand, brandName, size = "sm", className }: CardBrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const meta = CARD_BRANDS[brand];
  const label = getCardBrandLabel(brand, brandName);

  if (!meta.src || hasError || brand === "other") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-canvas-soft text-muted-foreground",
          sizeClasses[size],
          className,
        )}
        title={label}
      >
        <CreditCard className={size === "sm" ? "size-4" : "size-5"} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={meta.src}
      alt={meta.alt}
      className={cn("shrink-0 rounded-lg object-contain", sizeClasses[size], className)}
      onError={() => setHasError(true)}
    />
  );
}

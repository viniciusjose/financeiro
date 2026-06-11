export const CATEGORY_ICON_ALLOWLIST = [
  "ArrowLeftRight",
  "Baby",
  "Banknote",
  "Briefcase",
  "Bus",
  "Car",
  "Circle",
  "Coffee",
  "CreditCard",
  "Dog",
  "Dumbbell",
  "Film",
  "Fuel",
  "Gamepad2",
  "Gift",
  "GraduationCap",
  "HeartPulse",
  "Home",
  "Laptop",
  "Landmark",
  "MoreHorizontal",
  "Music",
  "Palmtree",
  "PawPrint",
  "Phone",
  "Plane",
  "Receipt",
  "Scissors",
  "ShoppingBag",
  "ShoppingCart",
  "Smartphone",
  "Sparkles",
  "Stethoscope",
  "Tag",
  "Train",
  "TrendingUp",
  "Tv",
  "UtensilsCrossed",
  "Wallet",
  "Wifi",
  "Wine",
  "Wrench",
  "Zap",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_ALLOWLIST)[number];

export const CATEGORY_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isAllowedCategoryIcon(icon: string): icon is CategoryIconName {
  return (CATEGORY_ICON_ALLOWLIST as readonly string[]).includes(icon);
}

export function isValidCategoryColor(color: string): boolean {
  return CATEGORY_COLOR_REGEX.test(color);
}

import { getCategoryIconComponent } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, color, size = 16, className }: CategoryIconProps) {
  const Icon = getCategoryIconComponent(icon);

  return <Icon className={cn("shrink-0", className)} style={{ color }} size={size} aria-hidden />;
}

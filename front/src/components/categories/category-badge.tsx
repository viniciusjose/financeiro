import { CategoryIcon } from "@/components/categories/category-icon";

interface CategoryBadgeProps {
  name?: string;
  icon?: string;
  color?: string;
}

export function CategoryBadge({ name, icon, color }: CategoryBadgeProps) {
  if (!name || !icon || !color) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-light text-ink"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
      }}
    >
      <CategoryIcon icon={icon} color={color} size={14} />
      {name}
    </span>
  );
}

export type CategoryViewMode = "list" | "grid";

const CATEGORY_VIEW_MODE_KEY = "categoryViewMode";

export function getCategoryViewMode(defaultMode: CategoryViewMode = "list"): CategoryViewMode {
  if (typeof localStorage === "undefined") {
    return defaultMode;
  }

  const stored = localStorage.getItem(CATEGORY_VIEW_MODE_KEY);

  if (stored === "list" || stored === "grid") {
    return stored;
  }

  return defaultMode;
}

export function setCategoryViewMode(mode: CategoryViewMode): void {
  localStorage.setItem(CATEGORY_VIEW_MODE_KEY, mode);
}

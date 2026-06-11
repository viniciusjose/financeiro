import { useCallback, useEffect, useState } from "react";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/category.schema";
import { type Category, categoriesService } from "@/services/categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await categoriesService.list({ includeInactive });
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar categorias.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCategory = useCallback(
    async (input: CreateCategoryInput) => {
      await categoriesService.create(input);
      await refresh();
    },
    [refresh],
  );

  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput) => {
      await categoriesService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await categoriesService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    categories,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

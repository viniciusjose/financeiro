import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getQueryErrorMessage } from "@/lib/query-error";
import { queryKeys } from "@/lib/query-keys";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/category.schema";
import { categoriesService } from "@/services/categories";

export function useCategories() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.categories.list({ includeInactive }),
    queryFn: () => categoriesService.list({ includeInactive }),
  });

  const invalidateCategories = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesService.create(input),
    onSuccess: invalidateCategories,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesService.update(id, input),
    onSuccess: invalidateCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: invalidateCategories,
  });

  const createCategory = useCallback(
    async (input: CreateCategoryInput) => {
      await createMutation.mutateAsync(input);
    },
    [createMutation],
  );

  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput) => {
      await updateMutation.mutateAsync({ id, input });
    },
    [updateMutation],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    categories,
    isLoading,
    error: getQueryErrorMessage(error, "Erro ao carregar categorias."),
    includeInactive,
    setIncludeInactive,
    refresh: refetch,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

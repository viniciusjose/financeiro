import { api } from "@/lib/api";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/category.schema";
import { toApiCreatePayload, toApiUpdatePayload } from "@/schemas/category.schema";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
  spendingLimitCents: number | null;
  monthSpentCents: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListCategoriesResponse {
  categories: Category[];
}

interface CategoryResponse {
  category: Category;
}

export const categoriesService = {
  async list(options?: { type?: Category["type"]; includeInactive?: boolean }) {
    const params = new URLSearchParams();

    if (options?.type) {
      params.set("type", options.type);
    }

    if (options?.includeInactive) {
      params.set("includeInactive", "true");
    }

    const query = params.toString();
    const path = query ? `/api/categories?${query}` : "/api/categories";
    const data = await api.get<ListCategoriesResponse>(path);
    return data.categories;
  },

  async getById(id: string) {
    const data = await api.get<CategoryResponse>(`/api/categories/${id}`);
    return data.category;
  },

  async create(input: CreateCategoryInput) {
    const data = await api.post<CategoryResponse>("/api/categories", toApiCreatePayload(input));
    return data.category;
  },

  async update(id: string, input: UpdateCategoryInput) {
    const data = await api.put<CategoryResponse>(
      `/api/categories/${id}`,
      toApiUpdatePayload(input),
    );
    return data.category;
  },

  async delete(id: string) {
    await api.delete<null>(`/api/categories/${id}`);
  },
};

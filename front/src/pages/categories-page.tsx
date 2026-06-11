import { Plus, Tags } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryGridItem, CategoryListItem } from "@/components/categories/category-list-item";
import { CategoryViewToggle } from "@/components/categories/category-view-toggle";
import { PageHeading } from "@/components/layout/page-heading";
import { PageShell } from "@/components/layout/page-shell";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import {
  CategoryTypeFilterControl,
  matchesCategoryTypeFilter,
  type CategoryTypeFilter,
} from "@/components/categories/category-type-filter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import {
  getCategoryViewMode,
  setCategoryViewMode,
  type CategoryViewMode,
} from "@/lib/category-view-storage";
import { toast } from "@/lib/toast";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/schemas/category.schema";
import type { Category } from "@/services/categories";

export function CategoriesPage() {
  const {
    categories,
    isLoading,
    error,
    includeInactive,
    setIncludeInactive,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>();
  const [archiveCategory, setArchiveCategory] = useState<Category | undefined>();
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>("all");
  const [viewMode, setViewMode] = useState<CategoryViewMode>(() => getCategoryViewMode());
  const includeInactiveId = useId();

  const handleViewModeChange = (mode: CategoryViewMode) => {
    setViewMode(mode);
    setCategoryViewMode(mode);
  };

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => matchesCategoryTypeFilter(category, typeFilter))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [categories, typeFilter]);

  const isInitialLoading = isLoading && categories.length === 0;

  const openCreate = () => {
    setEditingCategory(undefined);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CreateCategoryInput | UpdateCategoryInput) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, values);
      return;
    }

    await createCategory(values);
  };

  const handleDelete = async () => {
    if (!deletingCategory) {
      return;
    }

    try {
      await deleteCategory(deletingCategory.id);
      toast.success("Categoria removida com sucesso.");
      setDeletingCategory(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir a categoria.";
      toast.error(message);

      if (message.includes("transações vinculadas")) {
        setArchiveCategory(deletingCategory);
        setDeletingCategory(undefined);
      }
    }
  };

  const handleArchive = async () => {
    if (!archiveCategory) {
      return;
    }

    try {
      await updateCategory(archiveCategory.id, {
        name: archiveCategory.name,
        icon: archiveCategory.icon,
        color: archiveCategory.color,
        type: archiveCategory.type,
        description: archiveCategory.description ?? "",
        isActive: false,
      });
      toast.success("Categoria arquivada com sucesso.");
      setArchiveCategory(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível arquivar a categoria.";
      toast.error(message);
    }
  };

  return (
    <>
      <PageShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeading
            title="Categorias"
            description="Organize seu vocabulário financeiro com ícones e cores."
            icon={Tags}
            iconClassName="text-magenta"
          />
          <Button type="button" size="sm" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nova categoria
          </Button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <CategoryTypeFilterControl value={typeFilter} onChange={setTypeFilter} />

          <div className="flex flex-wrap items-center gap-4">
            <CategoryViewToggle value={viewMode} onChange={handleViewModeChange} />

            <label
              htmlFor={includeInactiveId}
              className="flex shrink-0 items-center gap-2 text-[14px] font-light text-muted-foreground"
            >
              <Checkbox
                id={includeInactiveId}
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              Mostrar arquivadas
            </label>
          </div>
        </div>

        {isInitialLoading ? (
          <div
            className={cn(viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "space-y-3")}
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Carregando categorias</span>
            <Skeleton className={cn(viewMode === "grid" ? "aspect-4/3 w-full rounded-lg" : "h-16 w-full rounded-lg")} />
            <Skeleton className={cn(viewMode === "grid" ? "aspect-4/3 w-full rounded-lg" : "h-16 w-full rounded-lg")} />
            {viewMode === "grid" ? (
              <Skeleton className="aspect-4/3 w-full rounded-lg sm:block" />
            ) : null}
          </div>
        ) : null}

        {!isInitialLoading && error ? (
          <div
            className="rounded-lg border border-hairline bg-canvas p-6"
            role="alert"
            aria-live="polite"
          >
            <p className="text-[15px] font-light text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              {isLoading ? "Carregando…" : "Tentar novamente"}
            </Button>
          </div>
        ) : null}

        {!isInitialLoading && !error && categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">Nenhuma categoria cadastrada</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Crie categorias para classificar receitas e despesas com identidade visual.
            </p>
            <Button type="button" size="sm" className="mt-6" onClick={openCreate}>
              <Plus aria-hidden="true" />
              Criar primeira categoria
            </Button>
          </div>
        ) : null}

        {!isInitialLoading && !error && categories.length > 0 && filteredCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
            <h2 className="text-heading-sm text-ink">
              Nenhuma categoria de {typeFilter === "expense" ? "despesa" : "receita"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] font-light text-muted-foreground">
              Ajuste o filtro ou crie uma categoria compatível com este tipo.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setTypeFilter("all")}>
                Ver todas
              </Button>
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus aria-hidden="true" />
                Nova categoria
              </Button>
            </div>
          </div>
        ) : null}

        {!isInitialLoading && !error && filteredCategories.length > 0 && viewMode === "list" ? (
          <div
            className={cn(
              "overflow-x-auto rounded-lg border border-hairline bg-canvas",
              isLoading && "pointer-events-none opacity-60 motion-reduce:transition-none",
            )}
            aria-busy={isLoading}
          >
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-hairline bg-canvas-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 text-caption font-normal text-muted-foreground">
                    Categoria
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground sm:table-cell"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground md:table-cell"
                  >
                    Orçamento
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 text-caption font-normal text-muted-foreground lg:table-cell"
                  >
                    % utilizado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-normal text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <CategoryListItem
                    key={category.id}
                    category={category}
                    onEdit={openEdit}
                    onDelete={setDeletingCategory}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isInitialLoading && !error && filteredCategories.length > 0 && viewMode === "grid" ? (
          <ul
            className={cn(
              "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
              isLoading && "pointer-events-none opacity-60 motion-reduce:transition-none",
            )}
            aria-busy={isLoading}
          >
            {filteredCategories.map((category) => (
              <li key={category.id} className="min-w-0">
                <CategoryGridItem
                  category={category}
                  onEdit={openEdit}
                  onDelete={setDeletingCategory}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </PageShell>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria "{deletingCategory?.name}" será removida permanentemente. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(archiveCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveCategory(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveCategory?.name}" possui transações vinculadas. Deseja arquivá-la em vez de
              excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleArchive()}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

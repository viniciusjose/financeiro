import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CategoryColorPicker } from "@/components/categories/category-color-picker";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CategoryIconPicker } from "@/components/categories/category-icon-picker";
import { CategorySegmentedControl } from "@/components/categories/category-segmented-control";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/category-display";
import { CATEGORY_COLOR_PALETTE } from "@/lib/category-colors";
import { formatCentsAsBrlInput } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
  CATEGORY_TYPE_LABELS,
  type CategoryType,
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
} from "@/schemas/category.schema";
import type { Category } from "@/services/categories";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSubmit: (values: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
}

function getDefaultValues(category?: Category): CreateCategoryInput {
  if (!category) {
    return {
      name: "",
      description: "",
      icon: "Tag",
      color: CATEGORY_COLOR_PALETTE[0].hex,
      type: "expense",
      spendingLimit: "",
    };
  }

  return {
    name: category.name,
    description: category.description ?? "",
    icon: category.icon,
    color: category.color,
    type: category.type,
    spendingLimit:
      category.type === "expense" && category.spendingLimitCents != null
        ? formatCentsAsBrlInput(category.spendingLimitCents)
        : "",
    isActive: category.isActive,
  };
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(category);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: getDefaultValues(category),
  });

  const watchedIcon = form.watch("icon");
  const watchedColor = form.watch("color");
  const watchedName = form.watch("name");
  const watchedType = form.watch("type");

  const typeOptions = (
    Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[]
  ).map((type) => ({
    value: type,
    label: CATEGORY_TYPE_LABELS[type],
  }));

  useEffect(() => {
    if (open) {
      const defaults = getDefaultValues(category);
      form.reset(defaults);
      setDescriptionOpen(Boolean(defaults.description?.trim()));
    }
  }, [category, form, open]);

  useEffect(() => {
    if (watchedType !== "expense") {
      form.setValue("spendingLimit", "");
    }
  }, [form, watchedType]);

  const handleSubmit = async (values: CreateCategoryInput) => {
    try {
      await onSubmit(values);
      toast.success(
        isEditing ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.",
      );
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar a categoria.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-hairline px-4 py-4 sm:px-6">
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize nome, ícone, cor e tipo da categoria."
              : "Crie uma categoria para classificar suas transações."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-soft px-4 py-3">
                  <div
                    className="flex size-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${watchedColor}22` }}
                  >
                    <CategoryIcon icon={watchedIcon} color={watchedColor} size={24} />
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Preview</p>
                    <p className="text-[15px] text-ink">{watchedName.trim() || "Nova categoria"}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: Alimentação"
                          maxLength={CATEGORY_NAME_MAX_LENGTH}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-caption text-muted-foreground/50">
                        Máximo de {CATEGORY_NAME_MAX_LENGTH} caracteres para exibição nos seletores.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Tipo</FormLabel>
                      <FormControl>
                        <CategorySegmentedControl
                          options={typeOptions}
                          value={field.value}
                          onChange={field.onChange}
                          ariaLabel="Tipo"
                          stretch
                        />
                      </FormControl>
                      {watchedType === "both" ? (
                        <p className="text-caption text-muted-foreground">
                          Válida para receitas e despesas.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedType === "expense" ? (
                  <FormField
                    control={form.control}
                    name="spendingLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orçamento mensal</FormLabel>
                        <FormControl>
                          <MoneyInput {...field} value={field.value ?? ""} />
                        </FormControl>
                        <p className="text-caption text-muted-foreground/50">
                          Opcional. Defina um orçamento mensal para acompanhar os gastos desta categoria.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Ícone</FormLabel>
                      <CategoryIconPicker
                        value={field.value}
                        color={watchedColor}
                        onValueChange={field.onChange}
                        disabled={field.disabled}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Cor</FormLabel>
                      <CategoryColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={field.disabled}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!descriptionOpen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start px-0 text-primary hover:bg-transparent hover:text-primary-deep"
                    onClick={() => setDescriptionOpen(true)}
                  >
                    Adicionar descrição (opcional)
                  </Button>
                ) : (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex.: Mercado, restaurantes, delivery"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? true}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                          Categoria ativa
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-hairline px-4 py-4 sm:px-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Salvando…"
                    : "Criando…"
                  : isEditing
                    ? "Salvar alterações"
                    : "Criar categoria"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

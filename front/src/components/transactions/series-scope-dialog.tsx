import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ApplyScope } from "@/schemas/transaction.schema";

interface SeriesScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "edit" | "delete";
  description: string;
  onConfirm: (scope: ApplyScope) => void;
  isSubmitting?: boolean;
}

export function SeriesScopeDialog({
  open,
  onOpenChange,
  mode,
  description,
  onConfirm,
  isSubmitting = false,
}: SeriesScopeDialogProps) {
  const title = mode === "edit" ? "Aplicar alterações" : "Excluir ocorrências";
  const actionLabel = mode === "edit" ? "Salvar" : "Excluir";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="data-[size=default]:sm:max-w-2xl">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">
            &quot;{description}&quot; faz parte de uma série. Deseja aplicar{" "}
            {mode === "edit" ? "as alterações" : "a exclusão"} somente nesta ocorrência ou também nas
            futuras?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:flex-row sm:flex-nowrap sm:justify-center">
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onConfirm("only_this")}
          >
            Somente esta ocorrência
          </Button>
          <Button
            type="button"
            variant={mode === "delete" ? "destructive" : "default"}
            disabled={isSubmitting}
            onClick={() => onConfirm("this_and_future")}
          >
            {actionLabel} esta e as futuras
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

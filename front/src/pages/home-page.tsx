import { PageShell } from "@/components/layout/page-shell";
import { getUserDisplayName } from "@/lib/user-display";
import { useAuth } from "@/providers/auth-provider";

export function HomePage() {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user?.name, user?.email);

  return (
    <PageShell>
      <div>
        <h1 className="text-display-md text-ink">Olá, {displayName}</h1>
        <p className="mt-2 max-w-prose text-[15px] font-light text-muted-foreground">
          Seu painel financeiro será exibido aqui em breve.
        </p>
      </div>
    </PageShell>
  );
}

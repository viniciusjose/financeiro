import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth-storage";
import { useAuth } from "@/providers/auth-provider";

export function SessionRecovery({ children }: { children: React.ReactNode }) {
  const { sessionError, refreshSession, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return children;
  }

  if (sessionError && getToken()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4">
        <p className="max-w-md text-center text-[15px] font-light text-ink" role="alert">
          {sessionError}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => void refreshSession()}>Tentar novamente</Button>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Ir para login
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

import { Navigate, useSearchParams } from "react-router-dom";
import { AuthLoading } from "@/components/auth/auth-loading";
import { getSafeRedirect } from "@/lib/redirect";
import { useAuth } from "@/providers/auth-provider";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to={getSafeRedirect(searchParams)} replace />;
  }

  return children;
}

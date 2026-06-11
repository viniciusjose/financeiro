import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth-storage";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import { type AuthUser, authService } from "@/services/auth";

interface AuthProviderState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthProviderContext = createContext<AuthProviderState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setSessionError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSessionError(null);

    try {
      const data = await authService.me();
      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível validar a sessão.";

      if (message === "Não foi possível conectar. Tente novamente.") {
        setUser(null);
        setSessionError(message);
      } else {
        authService.clearToken();
        setUser(null);
        setSessionError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = async (input: LoginInput) => {
    await authService.login(input);
    const data = await authService.me();
    setUser(data.user);
    setSessionError(null);
  };

  const register = async (input: RegisterInput) => {
    const data = await authService.register(input);
    setUser(data.user);
    setSessionError(null);
  };

  const logout = () => {
    authService.clearToken();
    setUser(null);
    setSessionError(null);
  };

  const value: AuthProviderState = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    sessionError,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthProviderContext.Provider value={value}>{children}</AuthProviderContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthProviderContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

import { api } from "@/lib/api";
import { getRefreshToken, removeTokens, setTokens } from "@/lib/auth-storage";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "@/schemas/auth.schema";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  birthDate?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

function persistTokens(tokens: AuthTokens) {
  setTokens(tokens.accessToken, tokens.refreshToken);
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>("/api/auth/register", input);
    persistTokens(data);
    return data;
  },

  async login(input: LoginInput): Promise<AuthTokens> {
    const data = await api.post<AuthTokens>("/api/auth/login", input);
    persistTokens(data);
    return data;
  },

  async refresh(): Promise<AuthTokens> {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("Refresh token ausente");
    }

    const data = await api.post<AuthTokens>("/api/auth/refresh", { refreshToken });
    persistTokens(data);
    return data;
  },

  async me(): Promise<MeResponse> {
    return api.get<MeResponse>("/api/auth/me");
  },

  async changePassword(input: Pick<ChangePasswordInput, "currentPassword" | "newPassword">) {
    return api.put<null>("/api/auth/password", input);
  },

  clearToken() {
    removeTokens();
  },
};

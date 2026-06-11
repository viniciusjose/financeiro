import { getAccessToken } from "@/lib/auth-storage";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getAccessToken();
    const headers = new Headers(options.headers);

    if (options.body != null && options.body !== "") {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error("Não foi possível conectar. Tente novamente.");
    }

    let body: ApiResponse<T>;

    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error("Erro na requisição");
    }

    if (!response.ok || !body.success) {
      throw new Error(body.message ?? "Erro na requisição");
    }

    return body.data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, data: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put<T>(path: string, data: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();

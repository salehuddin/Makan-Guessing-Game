export const apiBase = import.meta.env.VITE_API_URL ?? "/api";
const API_BASE = apiBase;

function getToken(): string | null {
  return localStorage.getItem("guesseat_token");
}

export function setToken(token: string): void {
  localStorage.setItem("guesseat_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("guesseat_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

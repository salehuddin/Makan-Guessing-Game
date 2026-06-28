import { Platform } from "react-native";

declare const process: { env?: Record<string, string | undefined> } | undefined;

function resolveApiBase(): string {
  // Production builds expose the API base via EAS environment variables
  // (EXPO_PUBLIC_API_URL). Local dev uses emulator/host fallbacks.
  const envValue = typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined;

  if (typeof envValue === "string" && envValue.length > 0) {
    return envValue.replace(/\/+$/, "");
  }

  return Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://127.0.0.1:8000/api";
}

export const apiBase = resolveApiBase();
const API_BASE = apiBase;

const TOKEN_KEY = "guesseat_token";

let tokenCache: string | null = null;

export async function getToken(): Promise<string | null> {
  if (tokenCache) return tokenCache;
  try {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    tokenCache = await AsyncStorage.default.getItem(TOKEN_KEY);
    return tokenCache;
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  tokenCache = token;
  try {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.default.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export async function clearToken(): Promise<void> {
  tokenCache = null;
  try {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.default.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

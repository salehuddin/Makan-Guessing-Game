import { create } from "zustand";
import { api, clearToken, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  init: () => Promise<void>;
  loginWithEmail: (email: string, password: string, deviceName: string) => Promise<void>;
  registerWithEmail: (username: string, email: string, password: string, deviceName: string) => Promise<void>;
  loginWithSocial: (provider: string, token: string, deviceName: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  init: async () => {
    const token = await getToken();
    if (token) {
      try {
        const data = await api<{ user: User }>("/user");
        set({ user: data.user, isLoading: false });
      } catch {
        await clearToken();
        set({ user: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  loginWithEmail: async (email, password, deviceName) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, device_name: deviceName }),
    });
    await setToken(data.token);
    set({ user: data.user });
  },

  registerWithEmail: async (username, email, password, deviceName) => {
    const data = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, device_name: deviceName }),
    });
    await setToken(data.token);
    set({ user: data.user });
  },

  loginWithSocial: async (provider, token, deviceName) => {
    const data = await api<{ token: string; user: User }>("/auth/social", {
      method: "POST",
      body: JSON.stringify({ provider, token, device_name: deviceName }),
    });
    await setToken(data.token);
    set({ user: data.user });
  },

  sendPhoneOtp: async (phone) => {
    await api("/user/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  verifyPhoneOtp: async (phone, code) => {
    const data = await api<{ user: User }>("/user/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    set({ user: data.user });
  },

  logout: async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await clearToken();
    set({ user: null });
  },
}));

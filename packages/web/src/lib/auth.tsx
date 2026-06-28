import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, setToken } from "./api";

interface User {
  id: number;
  username: string;
  phone: string | null;
  phone_verified_at: string | null;
  email: string | null;
  is_admin: boolean;
  trust_tier: string;
  xp_total: number;
  guesses_played_count?: number;
  correct_guesses_count?: number;
  best_guess_streak?: number;
  guesser_streak?: number;
  submitter_streak?: number;
  guesser_score_total?: number;
  approved_count?: number;
  rejected_count?: number;
  district?: string;
  profile_bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string, deviceName: string) => Promise<void>;
  registerWithEmail: (username: string, email: string, password: string, deviceName: string) => Promise<void>;
  loginWithSocial: (provider: string, token: string, deviceName: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<void>;
  updateProfile: (profile: Partial<Pick<User, "username" | "district" | "profile_bio" | "avatar_url" | "cover_url">>) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("guesseat_token");
    if (token) {
      api<{ user: User }>("/user")
        .then((data) => setUser(data.user))
        .catch(() => clearToken())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string, deviceName: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, device_name: deviceName }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const registerWithEmail = useCallback(async (username: string, email: string, password: string, deviceName: string) => {
    const data = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, device_name: deviceName }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const loginWithSocial = useCallback(async (provider: string, token: string, deviceName: string) => {
    const data = await api<{ token: string; user: User }>("/auth/social", {
      method: "POST",
      body: JSON.stringify({ provider, token, device_name: deviceName }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    await api("/user/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, code: string) => {
    const data = await api<{ user: User }>("/user/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    setUser(data.user);
  }, []);

  const updateProfile = useCallback(async (profile: Partial<Pick<User, "username" | "district" | "profile_bio" | "avatar_url" | "cover_url">>) => {
    const data = await api<{ user: User }>("/user", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithSocial,
        sendPhoneOtp,
        verifyPhoneOtp,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

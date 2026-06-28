import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LanguageToggle } from "../components/LanguageToggle";
import { Button } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useTranslation } from "../lib/i18n";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

const SOCIAL_PROVIDERS = ["google", "facebook", "apple", "tiktok"] as const;

function LoginComponent() {
  const { loginWithEmail, registerWithEmail, loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await loginWithEmail(email, password, "web-browser");
      } else {
        await registerWithEmail(username, email, password, "web-browser");
      }
      navigate({ to: "/play" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: (typeof SOCIAL_PROVIDERS)[number]) {
    setError("");
    setLoading(true);

    try {
      await loginWithSocial(provider, `mock:${provider}@guesseat.test`, "web-browser");
      navigate({ to: "/play" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black font-display text-chili text-glow-chili">
            GuessEat
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-1.5">{t("app.tagline")}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-danger/10 border border-danger/30 px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-chili text-white" : "text-slate-600"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "register" ? "bg-chili text-white" : "text-slate-600"}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            required
          />
          <Button type="submit" loading={loading}>
            {mode === "login" ? "Login" : "Create account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-500">
          <span className="h-px flex-1 bg-border" />
          or continue with
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SOCIAL_PROVIDERS.map((provider) => (
            <button
              key={provider}
              type="button"
              disabled={loading}
              onClick={() => handleSocial(provider)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold capitalize text-cream hover:border-chili transition-colors disabled:opacity-60"
            >
              {provider}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-medium text-slate-500">
          Phone verification is only required when you submit restaurants or photos.
        </p>
      </div>
    </div>
  );
}

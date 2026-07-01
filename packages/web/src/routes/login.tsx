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

const PROVIDER_META: Record<(typeof SOCIAL_PROVIDERS)[number], { label: string; bg: string }> = {
  google: { label: "Google", bg: "bg-white text-slate-700 border-border" },
  facebook: { label: "Facebook", bg: "bg-[#1877F2] text-white border-transparent" },
  apple: { label: "Apple", bg: "bg-slate-900 text-white border-transparent" },
  tiktok: { label: "TikTok", bg: "bg-slate-900 text-white border-transparent" },
};

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
      setError(err instanceof Error ? err.message : t("login.auth_failed"));
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
      setError(err instanceof Error ? err.message : t("login.social_failed"));
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
            {t("login.tab_login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "register" ? "bg-chili text-white" : "text-slate-600"}`}
          >
            {t("login.tab_signup")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.username")}
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.email")}
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.password")}
            className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-cream placeholder-muted-dim focus:border-chili focus:outline-none focus:ring-2 focus:ring-chili/20 transition-all"
            required
          />
          <Button type="submit" loading={loading}>
            {mode === "login" ? t("login.submit_login") : t("login.submit_register")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-500">
          <span className="h-px flex-1 bg-border" />
          {t("login.or_divider")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2.5">
          {SOCIAL_PROVIDERS.map((provider) => {
            const meta = PROVIDER_META[provider];
            return (
              <button
                key={provider}
                type="button"
                disabled={loading}
                onClick={() => handleSocial(provider)}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 ${meta.bg}`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs font-medium text-slate-500">
          {t("login.phone_note")}
        </p>
      </div>
    </div>
  );
}

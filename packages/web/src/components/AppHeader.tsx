import { useAuth } from "../lib/auth";
import { LanguageToggle } from "./LanguageToggle";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/80 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chili text-xl font-bold text-white">
            G
          </div>
          <h1 className="text-lg font-black tracking-tight text-cream">
            GuessEat<span className="text-chili">.my</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user && (
            <button
              onClick={logout}
              className="hidden rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-cream sm:block"
            >
              {user.xp_total} XP
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

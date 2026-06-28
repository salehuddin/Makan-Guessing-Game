import { createRootRouteWithContext, Outlet, useLocation } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import { useTranslation } from "../lib/i18n";
import { Toaster } from "@/components/ui/sonner";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-muted animate-pulse font-display text-lg">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (location.pathname.startsWith("/admin")) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-full flex flex-col bg-base">
      {user && !isLoginPage && <AppHeader />}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <Outlet />
      </main>
      {user && !isLoginPage && <BottomNav />}
    </div>
  );
}

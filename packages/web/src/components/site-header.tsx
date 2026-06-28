import { useLocation } from "@tanstack/react-router"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/moderation": "Moderation",
  "/admin/photos": "Photos",
  "/admin/venues": "Venues",
  "/admin/users": "Users",
  "/admin/game-modes": "Game Modes",
  "/admin/daily-challenges": "Daily Challenges",
  "/admin/guesses": "Guesses",
  "/admin/xp-events": "XP Events",
  "/admin/ads": "Ad Views",
  "/admin/settings": "Settings",
  "/admin/integrations": "Integrations",
  "/admin/translations": "Translations",
}

export function SiteHeader() {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? "Admin"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
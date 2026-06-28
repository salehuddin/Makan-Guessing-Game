import * as React from "react"

import { Link, useLocation } from "@tanstack/react-router"

import { NavMain } from "@/components/nav-main"
import { NavDocuments } from "@/components/nav-documents"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  IconLayoutGrid,
  IconShieldCheck,
  IconCamera,
  IconBuildingStore,
  IconUsers,
  IconDice,
  IconChartBar,
  IconTarget,
  IconCoin,
  IconAd,
  IconSettings,
  IconPlugConnected,
  IconRating18Plus,
  IconInnerShadowTop,
} from "@tabler/icons-react"
import { useAuth } from "@/lib/auth"

const iconCls = "size-4"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/admin">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">GuessEat Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            { title: "Dashboard", url: "/admin", icon: <IconLayoutGrid className={iconCls} />, isActive: isActive("/admin") },
            { title: "Moderation", url: "/admin/moderation", icon: <IconShieldCheck className={iconCls} />, isActive: isActive("/admin/moderation") },
          ]}
        />
        <NavDocuments
          label="Content"
          items={[
            { name: "Photos", url: "/admin/photos", icon: <IconCamera className={iconCls} />, isActive: isActive("/admin/photos") },
            { name: "Venues", url: "/admin/venues", icon: <IconBuildingStore className={iconCls} />, isActive: isActive("/admin/venues") },
            { name: "Users", url: "/admin/users", icon: <IconUsers className={iconCls} />, isActive: isActive("/admin/users") },
          ]}
        />
        <NavDocuments
          label="Game Management"
          items={[
            { name: "Game Modes", url: "/admin/game-modes", icon: <IconDice className={iconCls} />, isActive: isActive("/admin/game-modes") },
            { name: "Daily Challenges", url: "/admin/daily-challenges", icon: <IconChartBar className={iconCls} />, isActive: isActive("/admin/daily-challenges") },
          ]}
        />
        <NavDocuments
          label="Audit"
          items={[
            { name: "Guesses", url: "/admin/guesses", icon: <IconTarget className={iconCls} />, isActive: isActive("/admin/guesses") },
            { name: "XP Events", url: "/admin/xp-events", icon: <IconCoin className={iconCls} />, isActive: isActive("/admin/xp-events") },
            { name: "Ad Views", url: "/admin/ads", icon: <IconAd className={iconCls} />, isActive: isActive("/admin/ads") },
          ]}
        />
        <NavDocuments
          label="Tools"
          className="mt-auto"
          items={[
            { name: "Settings", url: "/admin/settings", icon: <IconSettings className={iconCls} />, isActive: isActive("/admin/settings") },
            { name: "Integrations", url: "/admin/integrations", icon: <IconPlugConnected className={iconCls} />, isActive: isActive("/admin/integrations") },
            { name: "Translations", url: "/admin/translations", icon: <IconRating18Plus className={iconCls} />, isActive: isActive("/admin/translations") },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.username ?? "Admin",
            email: user?.email ?? "admin@guesseat.my",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
import { Outlet } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="dark flex h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            <SiteHeader />
            <main className="@container/main flex flex-1 flex-col gap-4 overflow-auto p-4 lg:gap-6 lg:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
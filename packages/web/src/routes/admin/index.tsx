import { createFileRoute } from "@tanstack/react-router"
import { IconDice, IconCalendarEvent } from "@tabler/icons-react"

import { SectionCards } from "@/components/section-cards"
import { ChartCategoryCoverage } from "@/components/chart-category-coverage"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAdminDashboardStats } from "@/lib/admin-api"

export const Route = createFileRoute("/admin/")({
  component: DashboardRoute,
})

function DashboardRoute() {
  const { data } = useAdminDashboardStats()
  const modes = data?.data?.modes

  return (
    <div className="flex flex-col gap-6">
      <SectionCards />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Playability health overview — launch target is 150 photos, 150 venues, and all 7 categories covered.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCategoryCoverage />

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Classic Mode</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {modes?.classic_enabled ? "Enabled" : "Disabled"}
            </CardTitle>
            <CardAction>
              <Badge variant={modes?.classic_enabled ? "default" : "destructive"}>
                <IconDice />
                {modes?.classic_enabled ? "ON" : "OFF"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Classic guessing is currently {modes?.classic_enabled ? "available to players." : "turned off — visit Game Modes."}
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Daily Mode</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {modes?.daily_enabled ? "Enabled" : "Disabled"}
            </CardTitle>
            <CardAction>
              <Badge variant={modes?.daily_enabled ? "default" : "destructive"}>
                <IconCalendarEvent />
                {modes?.daily_enabled ? "ON" : "OFF"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Daily challenges are {modes?.daily_enabled ? "available to players." : "turned off — visit Game Modes."}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
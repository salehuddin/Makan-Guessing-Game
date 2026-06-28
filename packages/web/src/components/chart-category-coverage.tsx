"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { useAdminDashboardStats } from "@/lib/admin-api"

const chartConfig = {
  count: {
    label: "Photos",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartCategoryCoverage() {
  const { data, isLoading } = useAdminDashboardStats()
  const coverage = data?.data?.category_coverage ?? {}
  const covered = data?.data?.categories_covered ?? 0
  const total = data?.data?.categories_total ?? 7

  const chartData = Object.entries(coverage).map(([category, count]) => ({
    category: category.replace(/_/g, " "),
    count,
    fill: count >= 10 ? "var(--primary)" : "var(--destructive)",
  }))

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Category Coverage</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {isLoading ? "…" : `${covered}/${total}`}
        </CardTitle>
        <CardAction>
          <Badge variant={covered >= total ? "default" : "destructive"}>
            {covered >= total ? "All covered" : "Gaps exist"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={8}
              tickFormatter={(value: string) =>
                value.charAt(0).toUpperCase() + value.slice(1, 4)
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={8}
              width={32}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) =>
                    String(value).charAt(0).toUpperCase() + String(value).slice(1)
                  }
                />
              }
            />
            <Bar dataKey="count" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
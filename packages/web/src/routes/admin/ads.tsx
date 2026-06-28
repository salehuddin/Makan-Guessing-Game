import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconAd,
  IconCoin,
  IconDeviceDesktop,
  IconDeviceMobile,
} from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAdminAdViews,
  useAdminAdStats,
  type AdminAdView,
} from "@/lib/admin-api"

export const Route = createFileRoute("/admin/ads")({
  component: AdsRoute,
})

function AdsRoute() {
  const [search, setSearch] = React.useState("")
  const [platform, setPlatform] = React.useState("")
  const [placement, setPlacement] = React.useState("")
  const { data, isLoading } = useAdminAdViews({ search, platform, placement })
  const { data: statsData } = useAdminAdStats()

  const stats = statsData?.data
  const ads = data?.data ?? []

  const columns: ColumnDef<AdminAdView>[] = React.useMemo(
    () => [
      {
        accessorKey: "viewed_at",
        header: "Viewed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.viewed_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        id: "user.username",
        header: "User",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.user ? `@${row.original.user.username}` : "—"}
          </span>
        ),
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            {row.original.platform === "mobile" ? (
              <IconDeviceMobile className="size-3.5" />
            ) : (
              <IconDeviceDesktop className="size-3.5" />
            )}
            <span className="capitalize">{row.original.platform}</span>
          </div>
        ),
      },
      {
        accessorKey: "placement",
        header: "Placement",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.placement}
          </Badge>
        ),
      },
      {
        accessorKey: "ad_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.ad_type}
          </Badge>
        ),
      },
      {
        accessorKey: "reward_type",
        header: "Reward",
        cell: ({ row }) =>
          row.original.reward_type ? (
            <span className="flex items-center gap-1 text-sm">
              <IconCoin className="size-3.5 text-turmeric" />
              <span className="capitalize">
                {row.original.reward_type.replace(/_/g, " ")}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: "reward_amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.reward_amount}
          </div>
        ),
      },
      {
        accessorKey: "network",
        header: "Network",
        cell: ({ row }) =>
          row.original.network ? (
            <span className="text-sm text-muted-foreground">
              {row.original.network}
            </span>
          ) : (
            "—"
          ),
        enableSorting: false,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Ad Views</h2>
        <p className="text-sm text-muted-foreground">
          Ad impressions, reward audits, and monetization overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Ad Views</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats?.total_views ?? "…"}
            </CardTitle>
            <CardAction>
              <IconAd className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            All time ad impressions across platforms
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Rewards</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stats?.total_rewards ?? "…"}
            </CardTitle>
            <CardAction>
              <IconCoin className="size-5 text-turmeric" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total reward units distributed from ads
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>By Platform</CardDescription>
            <CardTitle className="text-sm">
              {stats
                ? Object.entries(stats.by_platform).map(([p, c]) => (
                    <span key={p} className="mr-3 inline-flex items-center gap-1">
                      <Badge variant="outline" className="capitalize">
                        {p}
                      </Badge>
                      <span className="tabular-nums">{c}</span>
                    </span>
                  ))
                : "…"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All platforms</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>
        <Select value={placement} onValueChange={setPlacement}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All placements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All placements</SelectItem>
            <SelectItem value="home_banner">Home Banner</SelectItem>
            <SelectItem value="play_bottom">Play Bottom</SelectItem>
            <SelectItem value="interstitial">Interstitial</SelectItem>
            <SelectItem value="rewarded">Rewarded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminDataTable
        columns={columns}
        data={ads}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyMessage="No ad views found."
      />
    </div>
  )
}
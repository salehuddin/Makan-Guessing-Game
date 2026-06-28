import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { IconTrendingUp } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAdminXpEvents, type AdminXpEvent } from "@/lib/admin-api"

export const Route = createFileRoute("/admin/xp-events")({
  component: XpEventsRoute,
})

const XP_TYPE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  photo_approved: "default",
  engagement_dividend: "secondary",
  penalty: "destructive",
}

function XpEventsRoute() {
  const [search, setSearch] = React.useState("")
  const [type, setType] = React.useState<string>("")
  const { data, isLoading } = useAdminXpEvents({ search, type })

  const events = data?.data ?? []

  const columns: ColumnDef<AdminXpEvent>[] = React.useMemo(
    () => [
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleString("en-GB", {
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
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant={XP_TYPE_VARIANT[row.original.type] ?? "outline"}
            className="font-mono text-xs"
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div
            className={`text-right tabular-nums font-medium ${
              row.original.amount >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {row.original.amount >= 0 ? "+" : ""}
            {row.original.amount}
          </div>
        ),
      },
      {
        accessorKey: "photo_id",
        header: "Photo",
        cell: ({ row }) =>
          row.original.photo_id ? (
            <Badge variant="outline" className="font-mono text-xs">
              {row.original.photo_id.slice(0, 8)}
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "detail",
        cell: ({ row }) => <XpDetailDrawer event={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">XP Events</h2>
        <p className="text-sm text-muted-foreground">
          XP awards and penalties audit trail
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="photo_approved">Photo Approved</SelectItem>
            <SelectItem value="engagement_dividend">
              Engagement Dividend
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AdminDataTable
        columns={columns}
        data={events}
        isLoading={isLoading}
        getRowId={(row) => String(row.id)}
        emptyMessage="No XP events found."
      />
    </div>
  )
}

function XpDetailDrawer({ event }: { event: AdminXpEvent }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          Breakdown
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>XP Event Breakdown</DrawerTitle>
          <DrawerDescription>
            {event.user ? `@${event.user.username}` : "—"} ·{" "}
            {new Date(event.created_at).toLocaleString("en-GB")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Type
              </div>
              <div className="mt-1">
                <Badge
                  variant={XP_TYPE_VARIANT[event.type] ?? "outline"}
                  className="font-mono text-xs"
                >
                  {event.type}
                </Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <IconTrendingUp className="size-3" /> Total amount
              </div>
              <div
                className={`mt-1 text-lg font-bold tabular-nums ${
                  event.amount >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {event.amount >= 0 ? "+" : ""}
                {event.amount} XP
              </div>
            </div>
          </div>
          {event.breakdown && (
            <>
              <Separator />
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Breakdown
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(event.breakdown).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5"
                    >
                      <span className="text-xs capitalize text-muted-foreground">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="tabular-nums text-sm font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconCheck,
  IconClock,
  IconCoin,
  IconDotsVertical,
  IconMapPin,
  IconPhoto,
  IconShieldCheck,
  IconTarget,
  IconUser,
  IconX,
} from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

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
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  useAdminUser,
  useAdminUsers,
  useUpdateUser,
  type AdminUser,
} from "@/lib/admin-api"
import { mediaUrl } from "@/lib/media"

export const Route = createFileRoute("/admin/users")({
  component: UsersRoute,
})

const PHOTO_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  quarantined: "destructive",
  rejected: "outline",
}

function UsersRoute() {
  const { data, isLoading } = useAdminUsers()
  const updateMutation = useUpdateUser()

  const [detailId, setDetailId] = React.useState<number | null>(null)

  function changeTier(user: AdminUser, tier: string) {
    updateMutation.mutate(
      { id: user.id, trust_tier: tier },
      {
        onSuccess: () =>
          toast.success(`Trust tier updated for @${user.username}`),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function toggleAdmin(user: AdminUser) {
    updateMutation.mutate(
      { id: user.id, is_admin: !user.is_admin },
      {
        onSuccess: () =>
          toast.success(
            `Admin ${user.is_admin ? "revoked" : "granted"} for @${user.username}`,
          ),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const columns: ColumnDef<AdminUser>[] = React.useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => (
          <span className="font-medium">@{row.original.username}</span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email ?? row.original.phone ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "trust_tier",
        header: "Trust Tier",
        cell: ({ row }) => {
          const user = row.original
          return (
            <Select
              defaultValue={user.trust_tier}
              onValueChange={(v) => changeTier(user, v)}
            >
              <SelectTrigger size="sm" className="w-32 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["new", "verified", "trusted", "curator"].map((tier) => (
                  <SelectItem key={tier} value={tier} className="capitalize">
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: "xp_total",
        header: () => <div className="text-right">XP</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">{row.original.xp_total}</div>
        ),
      },
      {
        accessorKey: "photos_count",
        header: () => <div className="text-right">Photos</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.photos_count}
          </div>
        ),
      },
      {
        accessorKey: "guesses_count",
        header: () => <div className="text-right">Guesses</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.guesses_count}
          </div>
        ),
      },
      {
        accessorKey: "is_admin",
        header: "Role",
        cell: ({ row }) =>
          row.original.is_admin ? (
            <Badge variant="default">
              <IconShieldCheck />
              Admin
            </Badge>
          ) : (
            <Badge variant="outline">
              <IconUser />
              User
            </Badge>
          ),
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                  size="icon"
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setDetailId(user.id)}>
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toggleAdmin(user)}
                  variant={user.is_admin ? "destructive" : undefined}
                >
                  {user.is_admin ? "Remove admin" : "Grant admin"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [updateMutation, setDetailId],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and trust tiers
        </p>
      </div>
      <AdminDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(row) => String(row.id)}
        toolbar={(table) => (
          <Input
            placeholder="Search by username, email, or phone…"
            value={
              (table.getColumn("username")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("username")?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        )}
        emptyMessage="No users found."
      />
      <UserDetailDrawer userId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

function UserDetailDrawer({
  userId,
  onClose,
}: {
  userId: number | null
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const { data, isLoading } = useAdminUser(userId)

  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (userId) {
      setOpen(true)
    }
  }, [userId])

  function handleClose(open: boolean) {
    setOpen(open)
    if (!open) {
      onClose()
    }
  }

  const user = data?.data

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            {isLoading
              ? "Loading…"
              : user
                ? `@${user.username}`
                : "User detail"}
          </DrawerTitle>
          <DrawerDescription>
            {user && (
              <span className="flex flex-wrap items-center gap-2">
                {user.email ?? user.phone ?? "—"}
                {user.is_admin && (
                  <Badge variant="default" className="gap-1">
                    <IconShieldCheck className="size-3" />
                    Admin
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {user.trust_tier}
                </Badge>
                {user.district && (
                  <span className="flex items-center gap-1">
                    <IconMapPin className="size-3" />
                    {user.district}
                  </span>
                )}
              </span>
            )}
          </DrawerDescription>
        </DrawerHeader>
        {user && (
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="XP Total" value={user.xp_total} />
              <StatBox label="Score Total" value={user.guesser_score_total} />
              <StatBox label="Played" value={user.guesses_played_count} />
              <StatBox label="Correct" value={user.correct_guesses_count} />
              <StatBox label="Approved" value={user.approved_count} />
              <StatBox label="Rejected" value={user.rejected_count} />
            </div>
            <Tabs defaultValue="photos">
              <TabsList>
                <TabsTrigger value="photos">
                  Photos ({user.photos.length})
                </TabsTrigger>
                <TabsTrigger value="guesses">
                  Guesses ({user.guesses.length})
                </TabsTrigger>
                <TabsTrigger value="xp">
                  XP Events ({user.xp_events.length})
                </TabsTrigger>
                <TabsTrigger value="social">
                  Social ({user.social_accounts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="photos" className="mt-3">
                {user.photos.length === 0 ? (
                  <EmptyHint text="No submitted photos" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {user.photos.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        {p.censored_url ? (
                          <img
                            src={mediaUrl(p.censored_url)}
                            alt=""
                            className="size-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded bg-muted">
                            <IconPhoto className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={PHOTO_STATUS_VARIANT[p.status] ?? "secondary"}
                              className="text-[10px] capitalize"
                            >
                              {p.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {p.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-sm font-medium">
                            <IconMapPin className="size-3 text-muted-foreground" />
                            {p.venue?.name ?? "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.total_guesses} guesses ·{" "}
                            {new Date(p.created_at).toLocaleDateString("en-GB")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="guesses" className="mt-3">
                {user.guesses.length === 0 ? (
                  <EmptyHint text="No guesses played" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {user.guesses.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {g.is_correct_name ? (
                            <IconCheck className="size-4 text-primary" />
                          ) : (
                            <IconX className="size-4 text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {g.photo?.venue?.name ?? "—"}
                            <span className="text-xs text-muted-foreground">
                              → {g.guessed_venue?.name ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {g.game_mode_slug && (
                              <Badge variant="outline" className="capitalize">
                                {g.game_mode_slug}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <IconTarget className="size-3" />
                              {g.score}
                            </span>
                            <span className="flex items-center gap-1">
                              <IconClock className="size-3" />
                              {(g.time_ms / 1000).toFixed(2)}s
                            </span>
                            {g.distance_meters != null && (
                              <span className="flex items-center gap-1">
                                <IconMapPin className="size-3" />
                                {Math.round(g.distance_meters)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="xp" className="mt-3">
                {user.xp_events.length === 0 ? (
                  <EmptyHint text="No XP events" />
                ) : (
                  <div className="flex flex-col gap-1">
                    {user.xp_events.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <IconCoin className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {e.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              e.amount >= 0
                                ? "tabular-nums text-primary"
                                : "tabular-nums text-destructive"
                            }
                          >
                            {e.amount >= 0 ? "+" : ""}
                            {e.amount}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="social" className="mt-3">
                {user.social_accounts.length === 0 ? (
                  <EmptyHint text="No linked social accounts" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {user.social_accounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {a.provider}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {a.provider_id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <IconUser className="size-4" />
      {text}
    </div>
  )
}
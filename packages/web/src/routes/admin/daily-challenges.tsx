import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconCalendarEvent,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconMapPin,
  IconPhoto,
  IconPlus,
  IconRocket,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  useAdminDailyChallenge,
  useAdminDailyChallenges,
  useCreateDailyChallenge,
  useDeleteDailyChallenge,
  useGenerateDailyChallenge,
  usePublishDailyChallenge,
  useUpdateDailyChallenge,
  type AdminDailyChallenge,
} from "@/lib/admin-api"
import { mediaUrl } from "@/lib/media"

export const Route = createFileRoute("/admin/daily-challenges")({
  component: DailyChallengesRoute,
})

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
  archived: "destructive",
}

const PHOTO_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  quarantined: "destructive",
  rejected: "outline",
}

function DailyChallengesRoute() {
  const { data, isLoading } = useAdminDailyChallenges()
  const createMutation = useCreateDailyChallenge()
  const generateMutation = useGenerateDailyChallenge()
  const publishMutation = usePublishDailyChallenge()
  const deleteMutation = useDeleteDailyChallenge()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [newDate, setNewDate] = React.useState("")
  const [detailId, setDetailId] = React.useState<string | null>(null)

  function handleCreate() {
    createMutation.mutate(
      { date: newDate },
      {
        onSuccess: () => {
          toast.success("Daily challenge created")
          setCreateOpen(false)
          setNewDate("")
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const columns: ColumnDef<AdminDailyChallenge>[] = React.useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-medium">
            <IconCalendarEvent className="size-4 text-muted-foreground" />
            {row.original.date}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => row.original.title ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={STATUS_VARIANT[row.original.status] ?? "outline"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
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
        accessorKey: "published_at",
        header: "Published",
        cell: ({ row }) =>
          row.original.published_at ? (
            <span className="text-sm text-muted-foreground">
              {new Date(row.original.published_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const challenge = row.original
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setDetailId(challenge.id)}>
                  <IconEye />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDetailId(challenge.id)}>
                  <IconEdit />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    generateMutation.mutate(challenge.id, {
                      onSuccess: () => toast.success("Photos regenerated"),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                >
                  <IconSparkles />
                  Regenerate photos
                </DropdownMenuItem>
                {challenge.status !== "published" && (
                  <DropdownMenuItem
                    onClick={() =>
                      publishMutation.mutate(challenge.id, {
                        onSuccess: () => toast.success("Challenge published"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                    disabled={challenge.photos_count === 0}
                  >
                    <IconRocket />
                    Publish
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete challenge for ${challenge.date}?`)) {
                      deleteMutation.mutate(challenge.id, {
                        onSuccess: () => toast.success("Challenge deleted"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  }}
                >
                  <IconTrash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [generateMutation, publishMutation, deleteMutation, setDetailId],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Daily Challenges</h2>
          <p className="text-sm text-muted-foreground">
            Generate and publish daily challenges
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Daily Challenge</DialogTitle>
              <DialogDescription>
                Generates a draft challenge with random approved photos for
                the selected date.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={!newDate || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <AdminDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        pageSize={20}
        emptyMessage="No daily challenges found."
      />
      <DailyChallengeDetailDrawer
        challengeId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}

function DailyChallengeDetailDrawer({
  challengeId,
  onClose,
}: {
  challengeId: string | null
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const { data, isLoading } = useAdminDailyChallenge(challengeId)
  const updateMutation = useUpdateDailyChallenge()

  const [open, setOpen] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState("")

  React.useEffect(() => {
    if (challengeId) {
      setOpen(true)
    }
  }, [challengeId])

  React.useEffect(() => {
    if (data?.data) {
      setTitleDraft(data.data.title ?? "")
    }
  }, [data])

  function handleClose(open: boolean) {
    setOpen(open)
    if (!open) {
      onClose()
    }
  }

  function handleSaveTitle() {
    if (!challengeId) return
    updateMutation.mutate(
      { id: challengeId, title: titleDraft || null },
      {
        onSuccess: () => toast.success("Title updated"),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const challenge = data?.data

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            {isLoading
              ? "Loading…"
              : challenge
                ? `Challenge · ${challenge.date}`
                : "Challenge detail"}
          </DrawerTitle>
          <DrawerDescription>
            {challenge && (
              <span className="flex items-center gap-2">
                <Badge
                  variant={STATUS_VARIANT[challenge.status] ?? "outline"}
                  className="capitalize"
                >
                  {challenge.status}
                </Badge>
                {challenge.published_at &&
                  `Published ${new Date(challenge.published_at).toLocaleString("en-GB")}`}
              </span>
            )}
          </DrawerDescription>
        </DrawerHeader>
        {challenge && (
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="dc-title">Title</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dc-title"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  placeholder="Untitled"
                  disabled={!challenge.can_be_edited}
                />
                {challenge.can_be_edited && (
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </Button>
                )}
              </div>
              {!challenge.can_be_edited && (
                <p className="text-xs text-muted-foreground">
                  This challenge cannot be edited because it is {challenge.status}.
                </p>
              )}
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <IconPhoto className="size-4 text-muted-foreground" />
              Assigned Photos ({challenge.photos.length})
            </div>
            {challenge.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos assigned. Use "Regenerate photos" to pick photos.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {challenge.photos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium">
                      {p.position}
                    </div>
                    {p.photo?.censored_url ? (
                      <img
                        src={mediaUrl(p.photo.censored_url)}
                        alt=""
                        className="size-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded bg-muted">
                        <IconPhoto className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {p.photo ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={PHOTO_STATUS_VARIANT[p.photo.status] ?? "secondary"}
                              className="text-[10px] capitalize"
                            >
                              {p.photo.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {p.photo.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-sm font-medium">
                            <IconMapPin className="size-3 text-muted-foreground" />
                            {p.photo.venue?.name ?? "Unknown venue"}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Photo not found (deleted)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
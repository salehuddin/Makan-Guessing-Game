import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
  IconPhoto,
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
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  useAdminPhotos,
  useApprovePhoto,
  useRejectPhoto,
  useQuarantinePhoto,
  type AdminPhoto,
} from "@/lib/admin-api"
import { mediaUrl } from "@/lib/media"

export const Route = createFileRoute("/admin/photos")({
  component: PhotosRoute,
})

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  quarantined: "destructive",
  rejected: "outline",
}

const CATEGORIES = [
  "signature_dish",
  "ambience",
  "exterior",
  "table_setting",
  "staff_uniforms",
  "menu_signage",
  "general",
] as const

function PhotosRoute() {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [category, setCategory] = React.useState("")
  const { data, isLoading } = useAdminPhotos({ search, status, category })
  const approveMutation = useApprovePhoto()
  const rejectMutation = useRejectPhoto()
  const quarantineMutation = useQuarantinePhoto()

  const columns: ColumnDef<AdminPhoto>[] = React.useMemo(
    () => [
      {
        accessorKey: "censored_url",
        header: "Preview",
        cell: ({ row }) => <PreviewThumb photo={row.original} />,
        enableSorting: false,
      },
      {
        accessorKey: "venue.name",
        header: "Venue",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.venue?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "venue.district",
        header: "District",
        cell: ({ row }) => row.original.venue?.district ?? "—",
      },
      {
        accessorKey: "submitter.username",
        header: "Submitter",
        cell: ({ row }) =>
          row.original.submitter
            ? `@${row.original.submitter.username}`
            : "—",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.category.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge variant={STATUS_VARIANT[status] ?? "secondary"} className="capitalize">
              {status === "approved" ? (
                <IconCircleCheckFilled className="fill-primary dark:fill-primary" />
              ) : status === "pending" ? (
                <IconLoader />
              ) : null}
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "total_guesses",
        header: () => <div className="text-right">Guesses</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.total_guesses}
          </div>
        ),
      },
      {
        id: "accuracy",
        header: () => <div className="text-right">Accuracy</div>,
        cell: ({ row }) => {
          const total = row.original.total_guesses
          const correct = row.original.correct_guesses
          const acc = total > 0 ? Math.round((correct / total) * 100) : null
          return (
            <div className="text-right tabular-nums text-muted-foreground">
              {acc !== null ? `${acc}%` : "—"}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "detail",
        cell: ({ row }) => <PhotoDetailDrawer photo={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const photo = row.original
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
                {photo.status !== "approved" && (
                  <DropdownMenuItem
                    onClick={() =>
                      approveMutation.mutate(photo.id, {
                        onSuccess: () => toast.success("Photo approved"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    Approve
                  </DropdownMenuItem>
                )}
                {photo.status !== "quarantined" && (
                  <DropdownMenuItem
                    onClick={() =>
                      quarantineMutation.mutate(photo.id, {
                        onSuccess: () => toast.success("Photo quarantined"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    Quarantine
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {photo.status !== "rejected" && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      rejectMutation.mutate(photo.id, {
                        onSuccess: () => toast.success("Photo rejected"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    Reject
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [approveMutation, rejectMutation, quarantineMutation],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Photos</h2>
        <p className="text-sm text-muted-foreground">
          Manage all submitted photos
        </p>
      </div>
      <AdminDataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by venue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="quarantined">Quarantined</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyMessage="No photos found."
      />
    </div>
  )
}

function PreviewThumb({ photo }: { photo: AdminPhoto }) {
  return photo.censored_url ? (
    <img
      src={mediaUrl(photo.censored_url)}
      alt=""
      className="h-10 w-10 rounded object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
      <IconPhoto className="size-4 text-muted-foreground" />
    </div>
  )
}

function PhotoDetailDrawer({ photo }: { photo: AdminPhoto }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          View
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{photo.venue?.name ?? "Photo detail"}</DrawerTitle>
          <DrawerDescription>
            {photo.venue?.district} ·{" "}
            <span className="capitalize">{photo.category.replace(/_/g, " ")}</span>
            {photo.submitter && ` · @${photo.submitter.username}`}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <img
            src={mediaUrl(photo.censored_url ?? photo.original_url ?? "")}
            alt={photo.venue?.name ?? "Photo"}
            className="max-h-64 w-full rounded-lg object-cover"
          />
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge variant={STATUS_VARIANT[photo.status] ?? "secondary"} className="capitalize">
                  {photo.status}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Category</div>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {photo.category.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Total guesses</div>
              <div className="mt-1 tabular-nums">{photo.total_guesses}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Correct guesses</div>
              <div className="mt-1 tabular-nums">{photo.correct_guesses}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Accuracy</div>
              <div className="mt-1 tabular-nums">
                {photo.total_guesses > 0
                  ? `${Math.round((photo.correct_guesses / photo.total_guesses) * 100)}%`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Quality score</div>
              <div className="mt-1 tabular-nums">{photo.quality_score.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Avg rating</div>
              <div className="mt-1 tabular-nums">{photo.avg_rating.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Client censored</div>
              <div className="mt-1">{photo.client_censored ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Needs review</div>
              <div className="mt-1">{photo.needs_human_review ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Auto category</div>
              <div className="mt-1 capitalize text-muted-foreground">
                {photo.auto_category ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Submitted</div>
              <div className="mt-1">
                {new Date(photo.created_at).toLocaleString("en-GB")}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid gap-1 font-mono text-xs text-muted-foreground">
            <div>photo.id: {photo.id}</div>
            <div>venue.id: {photo.venue_id}</div>
            <div>submitter.id: {photo.submitter_id}</div>
            {photo.original_url && <div>original: {photo.original_url}</div>}
          </div>
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
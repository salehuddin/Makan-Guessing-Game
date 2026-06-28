import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconCheck,
  IconClock,
  IconMapPin,
  IconTarget,
  IconX,
} from "@tabler/icons-react"
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
import { useAdminGuesses, type AdminGuess } from "@/lib/admin-api"
import { mediaUrl } from "@/lib/media"

export const Route = createFileRoute("/admin/guesses")({
  component: GuessesRoute,
})

function GuessesRoute() {
  const [search, setSearch] = React.useState("")
  const [mode, setMode] = React.useState<string>("")
  const { data, isLoading } = useAdminGuesses({
    search,
    game_mode_slug: mode,
  })

  const guesses = data?.data ?? []

  const columns: ColumnDef<AdminGuess>[] = React.useMemo(
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
        id: "guesser.username",
        header: "Guesser",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.guesser ? `@${row.original.guesser.username}` : "—"}
          </span>
        ),
      },
      {
        id: "photo.venue.name",
        header: "Photo Venue",
        cell: ({ row }) =>
          row.original.photo?.venue?.name ?? "—",
      },
      {
        id: "guessed_venue.name",
        header: "Guessed",
        cell: ({ row }) => row.original.guessed_venue?.name ?? "—",
      },
      {
        accessorKey: "game_mode_slug",
        header: "Mode",
        cell: ({ row }) => (
          <Badge
            variant={row.original.game_mode_slug === "daily" ? "secondary" : "outline"}
            className="capitalize"
          >
            {row.original.game_mode_slug ?? "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "is_correct_name",
        header: "Result",
        cell: ({ row }) =>
          row.original.is_correct_name ? (
            <Badge variant="default">
              <IconCheck className="size-3" />
              Correct
            </Badge>
          ) : (
            <Badge variant="destructive">
              <IconX className="size-3" />
              Wrong
            </Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: "score",
        header: () => <div className="text-right">Score</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">{row.original.score}</div>
        ),
      },
      {
        accessorKey: "time_ms",
        header: () => <div className="text-right">Time</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums text-muted-foreground">
            {(row.original.time_ms / 1000).toFixed(1)}s
          </div>
        ),
      },
      {
        id: "detail",
        cell: ({ row }) => <GuessDetailDrawer guess={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Guesses</h2>
        <p className="text-sm text-muted-foreground">
          Read-only gameplay audit trail
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by guesser or venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All modes</SelectItem>
            <SelectItem value="classic">Classic</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AdminDataTable
        columns={columns}
        data={guesses}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyMessage="No guesses found."
      />
    </div>
  )
}

function GuessDetailDrawer({ guess }: { guess: AdminGuess }) {
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
          <DrawerTitle>Guess Detail</DrawerTitle>
          <DrawerDescription>
            {guess.guesser ? `@${guess.guesser.username}` : "—"} ·{" "}
            {new Date(guess.created_at).toLocaleString("en-GB")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {guess.photo?.censored_url && (
            <img
              src={mediaUrl(guess.photo.censored_url)}
              alt={guess.photo.venue?.name ?? "Photo"}
              className="max-h-64 w-full rounded-lg object-cover"
            />
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Correct venue
              </div>
              <div className="mt-1 font-medium">
                {guess.photo?.venue?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Guessed venue
              </div>
              <div className="mt-1 font-medium">
                {guess.guessed_venue?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Result
              </div>
              <div className="mt-1">
                {guess.is_correct_name ? (
                  <Badge variant="default">
                    <IconCheck className="size-3" /> Correct
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <IconX className="size-3" /> Wrong
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Game mode
              </div>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {guess.game_mode_slug ?? "—"}
                </Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <IconTarget className="size-3" /> Score
              </div>
              <div className="mt-1 tabular-nums">{guess.score}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <IconClock className="size-3" /> Time
              </div>
              <div className="mt-1 tabular-nums">
                {(guess.time_ms / 1000).toFixed(2)}s
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <IconMapPin className="size-3" /> Distance
              </div>
              <div className="mt-1 tabular-nums">
                {guess.distance_meters != null
                  ? `${Math.round(guess.distance_meters)} m`
                  : "—"}
              </div>
            </div>
            {guess.daily_challenge && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Daily challenge
                </div>
                <div className="mt-1 text-sm">{guess.daily_challenge.date}</div>
              </div>
            )}
          </div>
          {guess.shown_option_ids && guess.shown_option_ids.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Shown option IDs
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {guess.shown_option_ids.map((id) => (
                    <Badge key={id} variant="outline" className="font-mono text-xs">
                      {id.slice(0, 8)}
                    </Badge>
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
import { createFileRoute } from "@tanstack/react-router"
import {
  IconDice,
  IconLock,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  useAdminGameModes,
  useUpdateGameMode,
  type AdminGameMode,
} from "@/lib/admin-api"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export const Route = createFileRoute("/admin/game-modes")({
  component: GameModesRoute,
})

function GameModesRoute() {
  const { data, isLoading } = useAdminGameModes()
  const updateMutation = useUpdateGameMode()
  const modes = data?.data ?? []

  function toggleMode(mode: AdminGameMode) {
    updateMutation.mutate(
      { id: mode.id, enabled: !mode.enabled },
      {
        onSuccess: () =>
          toast.success(`${mode.name} ${mode.enabled ? "disabled" : "enabled"}`),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  function updateField(mode: AdminGameMode, field: string, value: unknown) {
    updateMutation.mutate(
      { id: mode.id, [field]: value },
      {
        onSuccess: () => toast.success(`${mode.name} updated`),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground animate-pulse">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Game Modes</h2>
        <p className="text-sm text-muted-foreground">
          Configure Classic, Daily, and custom game modes
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {modes.map((mode) => (
          <Card key={mode.id} className="@container/card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconDice className="size-5 text-muted-foreground" />
                  <CardTitle>{mode.name}</CardTitle>
                  {mode.is_protected && (
                    <Badge variant="outline" className="gap-1">
                      <IconLock className="size-3" />
                      Protected
                    </Badge>
                  )}
                </div>
                <CardAction>
                  <Switch
                    checked={mode.enabled}
                    onCheckedChange={() => toggleMode(mode)}
                    disabled={updateMutation.isPending}
                  />
                </CardAction>
              </div>
              {mode.description && (
                <CardDescription>{mode.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Slug</Label>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
                    {mode.slug}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Strategy
                  </Label>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
                    {mode.selection_strategy}
                    {mode.is_protected && " 🔒"}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${mode.id}-option_count`} className="text-xs">
                    Options per guess
                  </Label>
                  <Input
                    id={`${mode.id}-option_count`}
                    type="number"
                    defaultValue={mode.option_count}
                    min={2}
                    max={8}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value)
                      if (!Number.isNaN(v) && v !== mode.option_count) {
                        updateField(mode, "option_count", v)
                      }
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${mode.id}-round_count`} className="text-xs">
                    Rounds {mode.round_count === null && "(∞)"}
                  </Label>
                  <Input
                    id={`${mode.id}-round_count`}
                    type="number"
                    defaultValue={mode.round_count ?? ""}
                    min={1}
                    max={50}
                    placeholder="∞"
                    onBlur={(e) => {
                      const v = e.target.value
                        ? parseInt(e.target.value)
                        : null
                      if (v !== mode.round_count) {
                        updateField(mode, "round_count", v)
                      }
                    }}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={mode.is_builtin ? "secondary" : "outline"}
                >
                  {mode.is_builtin ? "Built-in" : "Custom"}
                </Badge>
                {mode.category_filter && (
                  <Badge variant="outline" className="capitalize">
                    {mode.category_filter.replace(/_/g, " ")}
                  </Badge>
                )}
                {mode.district_filter && (
                  <Badge variant="outline">{mode.district_filter}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
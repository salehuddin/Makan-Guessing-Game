import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { IconDeviceFloppy, IconInfoCircle, IconRotate } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  useAdminSettings,
  useUpdateSettings,
  type AdminSetting,
} from "@/lib/admin-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/admin/settings")({
  component: SettingsRoute,
})

const GROUP_LABELS: Record<string, string> = {
  game: "Game Modes",
  selection: "Selection Rules",
  display: "Content & Display",
  content: "Content & Display",
  security: "Security",
  ads: "Ads & Monetization",
  ads_mobile: "Ads — Mobile",
  ads_web: "Ads — Web",
  placements: "Ad Placements & Rewards",
}

const GROUP_ORDER = [
  "game",
  "selection",
  "display",
  "content",
  "security",
  "ads",
  "ads_mobile",
  "ads_web",
  "placements",
]

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === "number" && typeof b === "number") return a === b
  if (a == null && b == null) return true
  return String(a ?? "") === String(b ?? "")
}

function SettingsRoute() {
  const { data, isLoading } = useAdminSettings()
  const updateMutation = useUpdateSettings()

  const [draft, setDraft] = React.useState<Record<string, unknown>>({})
  const [original, setOriginal] = React.useState<Record<string, unknown>>({})

  React.useEffect(() => {
    if (data) {
      const map: Record<string, unknown> = {}
      data.data.forEach((s: AdminSetting) => {
        map[s.key] = s.value
      })
      setOriginal(map)
      setDraft(map)
    }
  }, [data])

  const settings = data?.data ?? []

  const groups = React.useMemo(
    () =>
      settings.reduce<Record<string, AdminSetting[]>>((acc, s) => {
        if (!acc[s.group]) acc[s.group] = []
        acc[s.group].push(s)
        return acc
      }, {}),
    [settings],
  )

  const orderedGroups = GROUP_ORDER.filter((g) => groups[g]).concat(
    Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g)),
  )

  const dirtyKeys = React.useMemo(
    () =>
      Object.keys(draft).filter((k) => !valuesEqual(draft[k], original[k])),
    [draft, original],
  )

  const isDirty = dirtyKeys.length > 0

  function setVal(key: string, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleSave() {
    const dirty: Record<string, unknown> = {}
    dirtyKeys.forEach((k) => {
      dirty[k] = draft[k]
    })
    updateMutation.mutate(dirty, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e) => toast.error(e.message),
    })
  }

  function handleDiscard() {
    setDraft(original)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Game Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure game parameters, content display, ads, and security
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-muted-foreground">
              {dirtyKeys.length} unsaved
            </span>
          )}
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={!isDirty || updateMutation.isPending}
          >
            <IconRotate />
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
          >
            <IconDeviceFloppy />
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {orderedGroups.map((group) => (
          <Card key={group} className="@container/card">
            <CardHeader>
              <CardTitle className="text-sm">
                {GROUP_LABELS[group] ?? group}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groups[group].map((setting, idx) => {
                const isDirtyField = !valuesEqual(
                  draft[setting.key],
                  original[setting.key],
                )
                return (
                  <div key={setting.key}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">{setting.label}</Label>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {setting.is_public ? "public" : "private"}
                          </Badge>
                        </div>
                        {setting.description && (
                          <p className="flex items-start gap-1 text-xs text-muted-foreground">
                            <IconInfoCircle className="mt-0.5 size-3 shrink-0" />
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <SettingControl
                        setting={setting}
                        value={draft[setting.key]}
                        isDirty={isDirtyField}
                        onChange={(v) => setVal(setting.key, v)}
                      />
                    </div>
                    {idx < groups[group].length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SettingControl({
  setting,
  value,
  isDirty,
  onChange,
}: {
  setting: AdminSetting
  value: unknown
  isDirty: boolean
  onChange: (v: unknown) => void
}) {
  const inputCls = `w-48 ${isDirty ? "border-primary" : ""}`

  if (setting.enum_values && setting.enum_values.length > 0) {
    return (
      <Select
        value={(value as string) ?? ""}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className={isDirty ? "w-32 border-primary" : "w-32"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {setting.enum_values.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (setting.type === "boolean") {
    return <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} />
  }

  if (setting.type === "integer") {
    const range = setting.integer_range
    return (
      <Input
        type="number"
        value={(value as number) ?? ""}
        min={range?.min}
        max={range?.max}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={inputCls}
      />
    )
  }

  return (
    <Input
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  )
}
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconAlertCircle,
  IconBolt,
  IconBuilding,
  IconCheck,
  IconCoin,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlugConnected,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  INTEGRATION_MODES,
  useAdminIntegrations,
  useTestIntegration,
  useUpdateIntegration,
  type AdminIntegration,
  type IntegrationMode,
} from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/admin/integrations")({
  component: IntegrationsRoute,
})

const INTEGRATION_GROUPS: {
  label: string
  icon: React.ReactNode
  keys: string[]
}[] = [
  {
    label: "Authentication",
    icon: <IconShieldCheck className="size-4" />,
    keys: ["google_auth", "facebook_auth", "apple_auth", "tiktok_auth"],
  },
  {
    label: "Infrastructure",
    icon: <IconBuilding className="size-4" />,
    keys: ["twilio", "r2", "redis", "reverb", "google_maps"],
  },
  {
    label: "Moderation & ML",
    icon: <IconBolt className="size-4" />,
    keys: ["google_vision"],
  },
  {
    label: "Monetization",
    icon: <IconCoin className="size-4" />,
    keys: ["google_admob", "google_adsense", "grabfood"],
  },
]

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case "ok":
      return <IconCheck className="size-4 text-primary" />
    case "error":
      return <IconX className="size-4 text-destructive" />
    case "pending":
      return <IconAlertCircle className="size-4 text-muted-foreground" />
    default:
      return <IconInfoCircle className="size-4 text-muted-foreground" />
  }
}

function IntegrationsRoute() {
  const { data, isLoading } = useAdminIntegrations()
  const updateMutation = useUpdateIntegration()
  const testMutation = useTestIntegration()
  const integrations = data?.data ?? []

  const [pendingIds, setPendingIds] = React.useState<number[]>([])
  const [testingIds, setTestingIds] = React.useState<number[]>([])

  function setPending(id: number, pending: boolean) {
    setPendingIds((ids) =>
      pending ? [...ids, id] : ids.filter((i) => i !== id),
    )
  }

  function setTesting(id: number, testing: boolean) {
    setTestingIds((ids) =>
      testing ? [...ids, id] : ids.filter((i) => i !== id),
    )
  }

  function toggle(integration: AdminIntegration) {
    setPending(integration.id, true)
    updateMutation.mutate(
      { id: integration.id, enabled: !integration.enabled },
      {
        onSuccess: () =>
          toast.success(
            `${integration.label} ${integration.enabled ? "disabled" : "enabled"}`,
          ),
        onError: (e) => toast.error(e.message),
        onSettled: () => setPending(integration.id, false),
      },
    )
  }

  function changeMode(integration: AdminIntegration, mode: IntegrationMode) {
    setPending(integration.id, true)
    updateMutation.mutate(
      { id: integration.id, mode },
      {
        onSuccess: () => toast.success(`${integration.label} mode → ${mode}`),
        onError: (e) => toast.error(e.message),
        onSettled: () => setPending(integration.id, false),
      },
    )
  }

  function updateCredentials(integration: AdminIntegration, settings: Record<string, string>) {
    setPending(integration.id, true)
    updateMutation.mutate(
      { id: integration.id, settings },
      {
        onSuccess: () => toast.success(`${integration.label} credentials saved`),
        onError: (e) => toast.error(e.message),
        onSettled: () => setPending(integration.id, false),
      },
    )
  }

  function testConnection(integration: AdminIntegration) {
    setTesting(integration.id, true)
    testMutation.mutate(integration.id, {
      onSuccess: (res) =>
        res.data.last_status === "ok"
          ? toast.success(`${integration.label}: connection OK`)
          : toast.error(
              `${integration.label}: ${res.data.last_error ?? "connection failed"}`,
            ),
      onError: (e) => toast.error(e.message),
      onSettled: () => setTesting(integration.id, false),
    })
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground animate-pulse">
        Loading…
      </div>
    )
  }

  const byKey = new Map(integrations.map((i) => [i.key, i]))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">External Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Toggle, configure credentials, and monitor third-party services. Values saved here override .env values.
        </p>
      </div>
      {INTEGRATION_GROUPS.map((group) => {
        const items = group.keys
          .map((k) => byKey.get(k))
          .filter((i): i is AdminIntegration => i !== undefined)
        if (items.length === 0) return null
        return (
          <div key={group.label} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {group.icon}
              {group.label}
            </div>
            <div className="flex flex-col gap-3">
              {items.map((integration) => {
                const pending = pendingIds.includes(integration.id)
                const testing = testingIds.includes(integration.id)
                return (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    pending={pending}
                    testing={testing}
                    onToggle={() => toggle(integration)}
                    onChangeMode={(mode) => changeMode(integration, mode)}
                    onTest={() => testConnection(integration)}
                    onSaveCredentials={(creds) => updateCredentials(integration, creds)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IntegrationCard({
  integration,
  pending,
  testing,
  onToggle,
  onChangeMode,
  onTest,
  onSaveCredentials,
}: {
  integration: AdminIntegration
  pending: boolean
  testing: boolean
  onToggle: () => void
  onChangeMode: (mode: IntegrationMode) => void
  onTest: () => void
  onSaveCredentials: (creds: Record<string, string>) => void
}) {
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (integration.credential_fields) {
      const initial: Record<string, string> = {}
      integration.credential_fields.forEach((f) => {
        initial[f.key] = f.value ?? ""
      })
      setDrafts(initial)
    }
  }, [integration.credential_fields])

  const fields = integration.credential_fields ?? []
  const hasChanges = React.useMemo(() => {
    return fields.some((f) => drafts[f.key] !== (f.value ?? ""))
  }, [drafts, fields])

  function handleFieldChange(key: string, val: string) {
    setDrafts((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <Card className="px-4 py-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 sm:w-1/2 items-start gap-2.5">
          <IconPlugConnected className="size-5 shrink-0 text-muted-foreground mt-0.5" />
          <div className="min-w-0">
            <span className="text-sm font-medium">
              {integration.label}
            </span>
            {integration.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {integration.description}
              </p>
            )}
            {integration.last_error && (
              <p className="mt-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {integration.last_error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:w-1/4 sm:justify-center">
          <Select
            value={integration.mode}
            onValueChange={(v) => onChangeMode(v as IntegrationMode)}
            disabled={pending}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(integration.available_modes ?? INTEGRATION_MODES).map(
                (m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StatusIcon
              status={integration.last_status ?? "pending"}
            />
            <span className="capitalize">
              {integration.last_status ?? "pending"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:w-1/4 sm:justify-end">
          <Switch
            checked={integration.enabled}
            onCheckedChange={onToggle}
            disabled={pending}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onTest}
            disabled={testing}
          >
            <IconBolt className="size-3.5" />
            {testing ? "Testing…" : "Test"}
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={`${integration.key}-${f.key}`} className="text-xs">
                    {f.label}
                  </Label>
                  <Input
                    id={`${integration.key}-${f.key}`}
                    type={f.secret ? "password" : "text"}
                    value={drafts[f.key] ?? ""}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    className="h-8 text-xs"
                    disabled={pending}
                    placeholder={f.has_value ? "••••••••" : "Not set"}
                  />
                </div>
              ))}
            </div>
            {hasChanges && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onSaveCredentials(drafts)}
                  disabled={pending}
                  className="h-7 text-xs"
                >
                  <IconDeviceFloppy className="size-3.5 mr-1" />
                  Save Keys
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {integration.last_checked_at && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Last checked:{" "}
          {new Date(integration.last_checked_at).toLocaleString(
            "en-GB",
          )}
        </p>
      )}
    </Card>
  )
}
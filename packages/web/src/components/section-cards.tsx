"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconShieldCheck,
  IconPhoto,
  IconBuildingStore,
  IconCalendarEvent,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { useAdminDashboardStats } from "@/lib/admin-api"

export function SectionCards() {
  const { data, isLoading } = useAdminDashboardStats()
  const s = data?.data

  const pending = s?.pending_moderation ?? 0
  const playable = s?.playable_photos ?? 0
  const venues = s?.total_venues ?? 0
  const challenge = s?.challenge_today
  const launchReady = playable >= 150 && venues >= 150

  return (
    <div className="@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Moderation</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {isLoading ? "…" : pending}
          </CardTitle>
          <CardAction>
            <Badge variant={pending > 0 ? "outline" : "secondary"}>
              <IconShieldCheck />
              {pending > 0 ? "Review" : "Clear"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {pending > 0 ? "Needs moderator review" : "Queue is clear"}{" "}
            <IconShieldCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {isLoading ? "Loading…" : `${s?.quarantined ?? 0} quarantined`}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Playable Photos</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {isLoading ? "…" : playable}
          </CardTitle>
          <CardAction>
            <Badge variant={playable >= 150 ? "default" : "destructive"}>
              <IconPhoto />
              {playable >= 150 ? "Launch ready" : "Below target"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Target: 150 photos{" "}
            {playable >= 150 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {isLoading ? "Loading…" : `${s?.never_guessed ?? 0} never guessed`}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Venues</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {isLoading ? "…" : venues}
          </CardTitle>
          <CardAction>
            <Badge variant={venues >= 150 ? "default" : "destructive"}>
              <IconBuildingStore />
              {venues >= 150 ? "Launch ready" : "Below target"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Target: 150 venues{" "}
            {venues >= 150 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${s?.venues_with_photos ?? 0} with approved photos`}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today's Daily Challenge</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {isLoading ? "…" : challenge?.status ?? "None"}
          </CardTitle>
          <CardAction>
            <Badge
              variant={
                challenge?.status === "published"
                  ? "default"
                  : challenge
                    ? "outline"
                    : "destructive"
              }
            >
              <IconCalendarEvent />
              {challenge ? challenge.status : "Missing"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {challenge
              ? challenge.title ?? `Challenge for today`
              : "No challenge scheduled"}{" "}
            {launchReady ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconAlertTriangle className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `Categories: ${s?.categories_covered ?? 0}/${s?.categories_total ?? 0}`}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
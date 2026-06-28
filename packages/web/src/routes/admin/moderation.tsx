import { createFileRoute } from "@tanstack/react-router"
import {
  IconCheck,
  IconPhotoOff,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  useAdminPendingPhotos,
  useApprovePhoto,
  useRejectPhoto,
  type AdminPhoto,
} from "@/lib/admin-api"
import { mediaUrl } from "@/lib/media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/lib/i18n"

export const Route = createFileRoute("/admin/moderation")({
  component: ModerationRoute,
})

function ModerationRoute() {
  const { t } = useTranslation()
  const { data, isLoading } = useAdminPendingPhotos()
  const approveMutation = useApprovePhoto()
  const rejectMutation = useRejectPhoto()

  const photos = data?.data ?? []
  const total = data?.meta.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("admin.moderation")}</h2>
          <p className="text-sm text-muted-foreground">
            {total} pending {total === 1 ? "photo" : "photos"} awaiting review
          </p>
        </div>
        {total > 0 && (
          <Badge variant="outline">
            <IconShieldCheck />
            {total} in queue
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">
          {t("admin.loading_queue")}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <IconPhotoOff className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("admin.queue_empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <ModerationCard
              key={photo.id}
              photo={photo}
              onApprove={() =>
                approveMutation.mutate(photo.id, {
                  onSuccess: () => toast.success("Photo approved"),
                  onError: (e) => toast.error(e.message),
                })
              }
              onReject={() =>
                rejectMutation.mutate(photo.id, {
                  onSuccess: () => toast.success("Photo rejected"),
                  onError: (e) => toast.error(e.message),
                })
              }
              isActioning={
                approveMutation.isPending || rejectMutation.isPending
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ModerationCard({
  photo,
  onApprove,
  onReject,
  isActioning,
}: {
  photo: AdminPhoto
  onApprove: () => void
  onReject: () => void
  isActioning: boolean
}) {
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden">
      <Drawer direction={isMobile ? "bottom" : "right"}>
        <CardHeader className="p-0">
          <DrawerTrigger asChild>
            <button className="block w-full text-left">
              {photo.censored_url ? (
                <img
                  src={mediaUrl(photo.censored_url)}
                  alt={photo.venue?.name ?? "Photo"}
                  className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground text-sm">
                  No preview
                </div>
              )}
            </button>
          </DrawerTrigger>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">
                {photo.venue?.name ?? t("admin.unknown_venue")}
              </div>
              <div className="text-xs text-muted-foreground">
                {photo.venue?.district} ·{" "}
                <span className="capitalize">
                  {photo.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">
                {t("admin.by")} @{photo.submitter?.username ?? t("admin.unknown")}
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {photo.status}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="gap-2 px-3 pb-3">
          <Button
            size="sm"
            className="flex-1"
            onClick={onApprove}
            disabled={isActioning}
          >
            <IconCheck />
            {t("admin.approve")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={onReject}
            disabled={isActioning}
          >
            <IconX />
            {t("admin.reject")}
          </Button>
        </CardFooter>
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>{photo.venue?.name ?? "Photo review"}</DrawerTitle>
            <DrawerDescription>
              {photo.venue?.district} · {photo.category} ·{" "}
              {photo.submitter ? `@${photo.submitter.username}` : "—"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            {photo.censored_url && (
              <img
                src={mediaUrl(photo.censored_url)}
                alt={photo.venue?.name ?? "Photo"}
                className="w-full rounded-lg object-cover"
              />
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Status
                </div>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {photo.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Category
                </div>
                <Badge variant="outline" className="mt-1 capitalize">
                  {photo.category.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Total guesses
                </div>
                <div className="mt-1 tabular-nums">{photo.total_guesses}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Submitted
                </div>
                <div className="mt-1">
                  {new Date(photo.created_at).toLocaleString("en-GB")}
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={onApprove} disabled={isActioning}>
              <IconCheck />
              Approve
            </Button>
            <Button variant="destructive" onClick={onReject} disabled={isActioning}>
              <IconX />
              Reject
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  )
}
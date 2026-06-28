import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import {
  IconDotsVertical,
  IconMapPin,
  IconPlus,
  IconStarFilled,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAdminVenues,
  useCreateVenue,
  useDeleteVenue,
  useGoogleVenueLookup,
  useGoogleVenueSearch,
  useUpdateVenue,
  type AdminVenue,
  type GooglePlaceResult,
} from "@/lib/admin-api"

export const Route = createFileRoute("/admin/venues")({
  component: VenuesRoute,
})

const HALAL_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  halal: "default",
  muslim_friendly: "secondary",
  non_halal: "destructive",
  unknown: "outline",
}

const VENUE_TYPES = [
  "restaurant", "mamak", "kopitiam", "hawker_stall", "warung", "cafe", "food_court", "chain",
] as const

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 3 }).map((_, i) => (
        <IconStarFilled
          key={i}
          className={
            i < value
              ? "size-3.5 text-turmeric"
              : "size-3.5 text-muted-foreground/20"
          }
        />
      ))}
    </div>
  )
}

function VenuesRoute() {
  const [search, setSearch] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [venueType, setVenueType] = React.useState("")
  const [halal, setHalal] = React.useState("")
  const { data, isLoading } = useAdminVenues({
    search,
    district,
    venue_type: venueType,
    halal_status: halal,
  })
  const deleteMutation = useDeleteVenue()
  const createMutation = useCreateVenue()
  const updateMutation = useUpdateVenue()
  const googleLookupMutation = useGoogleVenueLookup()
  const [googleLookingUp, setGoogleLookingUp] = React.useState(false)

  function handleGooglePick(placeId: string) {
    setGoogleLookingUp(true)
    googleLookupMutation.mutate(placeId, {
      onSuccess: (res) => {
        if (res.exists && res.venue) {
          toast.info(`This venue already exists: ${res.venue.name}`)
          setCreateOpen(false)
          setEditVenue(res.venue)
        } else if (res.details) {
          const d = res.details
          setForm({
            name: d.name,
            district: d.district || "",
            address: d.address,
            venue_type: d.venue_type,
            halal_status: "unknown",
            price_range: "1",
            lat: String(d.lat),
            lng: String(d.lng),
            cuisine_tags: "",
            google_place_id: d.place_id,
          })
          toast.success("Autocompleted from Google Maps — adjust as needed.")
        }
      },
      onError: (e) => toast.error(e.message),
      onSettled: () => setGoogleLookingUp(false),
    })
  }

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editVenue, setEditVenue] = React.useState<AdminVenue | null>(null)
  const [form, setForm] = React.useState<VenueFormValues>({
    name: "",
    district: "",
    address: "",
    venue_type: "restaurant",
    halal_status: "unknown",
    price_range: "1",
    lat: "",
    lng: "",
    cuisine_tags: "",
    google_place_id: "",
  })

  function handleCreate() {
    createMutation.mutate(buildVenueBody(form), {
      onSuccess: () => {
        toast.success(`Venue "${form.name}" created`)
        setCreateOpen(false)
        setForm({
          name: "",
          district: "",
          address: "",
          venue_type: "restaurant",
          halal_status: "unknown",
          price_range: "1",
          lat: "",
          lng: "",
          cuisine_tags: "",
          google_place_id: "",
        } as VenueFormValues)
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const columns: ColumnDef<AdminVenue>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "district",
        header: "District",
      },
      {
        accessorKey: "venue_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.venue_type.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "halal_status",
        header: "Halal",
        cell: ({ row }) => {
          const status = row.original.halal_status
          return (
            <Badge
              variant={HALAL_VARIANT[status] ?? "outline"}
              className="capitalize"
            >
              {status.replace(/_/g, " ")}
            </Badge>
          )
        },
      },
      {
        accessorKey: "price_range",
        header: "Price",
        cell: ({ row }) => <StarRating value={row.original.price_range} />,
        enableSorting: false,
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
        id: "location",
        header: "Coords",
        cell: ({ row }) => {
          const loc = row.original.location
          return loc ? (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <IconMapPin className="size-3" />
              {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
            </span>
          ) : (
            "—"
          )
        },
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const venue = row.original
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
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setEditVenue(venue)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete "${venue.name}"? This will also delete all its photos.`)) {
                      deleteMutation.mutate(venue.id, {
                        onSuccess: () => toast.success("Venue deleted"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  }}
                >
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
    [deleteMutation],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Venues</h2>
          <p className="text-sm text-muted-foreground">
            Manage restaurant locations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Venue</DialogTitle>
              <DialogDescription>
                Add a new restaurant or place to GuessEat.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <VenueFormFields
                form={form}
                setForm={setForm}
                onGooglePick={handleGooglePick}
                googleLookingUp={googleLookingUp}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  !form.name ||
                  !form.district ||
                  !form.lat ||
                  !form.lng
                }
              >
                {createMutation.isPending ? "Creating…" : "Create Venue"}
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
toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Input
              placeholder="District…"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-36"
            />
            <Select value={venueType} onValueChange={setVenueType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {VENUE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={halal} onValueChange={setHalal}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All halal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All halal</SelectItem>
                <SelectItem value="halal">Halal</SelectItem>
                <SelectItem value="muslim_friendly">Muslim Friendly</SelectItem>
                <SelectItem value="non_halal">Non-Halal</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        emptyMessage="No venues found."
      />
      {editVenue && (
        <VenueEditDialog
          venue={editVenue}
          onClose={() => setEditVenue(null)}
          onSave={(body) =>
            updateMutation.mutate(
              { id: editVenue.id, ...body },
              {
                onSuccess: () => {
                  toast.success("Venue updated")
                  setEditVenue(null)
                },
                onError: (e) => toast.error(e.message),
              },
            )
          }
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  )
}

interface VenueFormValues {
  name: string
  district: string
  address: string
  venue_type: string
  halal_status: string
  price_range: string
  lat: string
  lng: string
  cuisine_tags: string
  google_place_id: string
}

function GoogleVenueSearch({
  onPick,
}: {
  onPick: (placeId: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const { data, isLoading } = useGoogleVenueSearch(query)

  function handlePick(placeId: string) {
    onPick(placeId)
    setQuery("")
  }

  return (
    <div className="grid gap-2">
      <Label>Search on Google Maps</Label>
      <Input
        placeholder="Type a restaurant name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading && (
        <p className="text-xs text-muted-foreground animate-pulse">Searching Google Maps…</p>
      )}
      {!isLoading && data?.google && data.google.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border">
          {data.google.map((place: GooglePlaceResult) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handlePick(place.place_id)}
              className="flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-xs hover:bg-muted last:border-b-0"
            >
              <span className="font-medium">{place.name}</span>
              <span className="text-muted-foreground">{place.address}</span>
            </button>
          ))}
        </div>
      )}
      {!isLoading && query.length >= 2 && data?.google && data.google.length === 0 && (
        <p className="text-xs text-muted-foreground">No results from Google Maps.</p>
      )}
    </div>
  )
}

function VenueFormFields({
  form,
  setForm,
  onGooglePick,
  googleLookingUp,
}: {
  form: VenueFormValues
  setForm: React.Dispatch<React.SetStateAction<VenueFormValues>>
  onGooglePick: (placeId: string) => void
  googleLookingUp: boolean
}) {
  return (
    <>
      <GoogleVenueSearch onPick={onGooglePick} />
      {googleLookingUp && (
        <p className="text-xs text-muted-foreground animate-pulse">
 Fetching details from Google Maps…
        </p>
      )}
      {form.google_place_id && (
        <div className="rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
          Google Place ID: {form.google_place_id}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            value={form.district}
            onChange={(e) =>
              setForm({ ...form, district: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="venue_type">Type</Label>
          <Select
            value={form.venue_type}
            onValueChange={(v) => setForm({ ...form, venue_type: v })}
          >
            <SelectTrigger id="venue_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENUE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="halal_status">Halal Status</Label>
          <Select
            value={form.halal_status}
            onValueChange={(v) => setForm({ ...form, halal_status: v })}
          >
            <SelectTrigger id="halal_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="halal">Halal</SelectItem>
              <SelectItem value="muslim_friendly">Muslim Friendly</SelectItem>
              <SelectItem value="non_halal">Non-Halal</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price_range">Price Range</Label>
          <Select
            value={form.price_range}
            onValueChange={(v) => setForm({ ...form, price_range: v })}
          >
            <SelectTrigger id="price_range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">$</SelectItem>
              <SelectItem value="2">$$</SelectItem>
              <SelectItem value="3">$$$</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            placeholder="3.1390"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            placeholder="101.6869"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cuisine_tags">
          Cuisine Tags (comma-separated)
        </Label>
        <Input
          id="cuisine_tags"
          placeholder="malay, chinese, indian"
          value={form.cuisine_tags}
          onChange={(e) => setForm({ ...form, cuisine_tags: e.target.value })}
        />
      </div>
    </>
  )
}

function buildVenueBody(form: VenueFormValues) {
  return {
    name: form.name,
    district: form.district,
    address: form.address || null,
    venue_type: form.venue_type,
    halal_status: form.halal_status,
    price_range: parseInt(form.price_range),
    lat: parseFloat(form.lat),
    lng: parseFloat(form.lng),
    cuisine_tags: form.cuisine_tags
      ? form.cuisine_tags.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    google_place_id: form.google_place_id || null,
  }
}

function VenueEditDialog({
  venue,
  onClose,
  onSave,
  isSaving,
}: {
  venue: AdminVenue
  onClose: () => void
  onSave: (body: Record<string, unknown>) => void
  isSaving: boolean
}) {
  const googleLookupMutation = useGoogleVenueLookup()
  const [googleLookingUp, setGoogleLookingUp] = React.useState(false)
  const [form, setForm] = React.useState<VenueFormValues>(() => ({
    name: venue.name,
    district: venue.district,
    address: venue.address ?? "",
    venue_type: venue.venue_type,
    halal_status: venue.halal_status,
    price_range: String(venue.price_range),
    lat: venue.location ? String(venue.location.lat) : "",
    lng: venue.location ? String(venue.location.lng) : "",
    cuisine_tags: venue.cuisine_tags?.join(", ") ?? "",
    google_place_id: venue.google_place_id ?? "",
  }))

  function handleGooglePick(placeId: string) {
    setGoogleLookingUp(true)
    googleLookupMutation.mutate(placeId, {
      onSuccess: (res) => {
        if (res.details) {
          const d = res.details
          setForm({
            name: d.name,
            district: d.district || form.district,
            address: d.address,
            venue_type: d.venue_type,
            halal_status: form.halal_status,
            price_range: form.price_range,
            lat: String(d.lat),
            lng: String(d.lng),
            cuisine_tags: form.cuisine_tags,
            google_place_id: d.place_id,
          })
          toast.success("Autocompleted from Google Maps — adjust as needed.")
        }
      },
      onError: (e) => toast.error(e.message),
      onSettled: () => setGoogleLookingUp(false),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Venue</DialogTitle>
          <DialogDescription>{venue.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <VenueFormFields
            form={form}
            setForm={setForm}
            onGooglePick={handleGooglePick}
            googleLookingUp={googleLookingUp}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => onSave(buildVenueBody(form))}
            disabled={isSaving || !form.name || !form.district}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
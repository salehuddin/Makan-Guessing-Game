<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\VenueResource;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminVenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Venue::query()->withCount('photos');

        if ($search = $request->string('search')) {
            $query->where('name', 'ILIKE', "%{$search}%");
        }

        if ($district = $request->string('district')) {
            $query->where('district', $district);
        }

        if ($type = $request->string('venue_type')) {
            $query->where('venue_type', $type);
        }

        if ($halal = $request->string('halal_status')) {
            $query->where('halal_status', $halal);
        }

        $venues = $query->latest()->paginate(25);

        return response()->json([
            'data' => $venues->through(fn (Venue $venue) => array_merge(
                VenueResource::make($venue)->toArray($request),
                ['photos_count' => $venue->photos_count],
            )),
            'meta' => [
                'current_page' => $venues->currentPage(),
                'last_page' => $venues->lastPage(),
                'per_page' => $venues->perPage(),
                'total' => $venues->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'district' => ['required', 'string', 'max:255'],
            'venue_type' => ['required', Rule::in(Venue::VENUE_TYPES)],
            'halal_status' => ['required', Rule::in(['halal', 'non_halal', 'muslim_friendly', 'unknown'])],
            'price_range' => ['required', 'integer', 'between:1,3'],
            'cuisine_tags' => ['nullable', 'array'],
            'cuisine_tags.*' => ['string', 'max:100'],
            'google_place_id' => ['nullable', 'string', 'max:255'],
        ]);

        if (! empty($validated['google_place_id'])) {
            $existing = Venue::where('google_place_id', $validated['google_place_id'])->first();
            if ($existing) {
                return response()->json([
                    'message' => 'A venue with this Google Place ID already exists.',
                    'data' => VenueResource::make($existing),
                ], 422);
            }
        }

        $location = DB::raw("ST_SetSRID(ST_MakePoint({$validated['lng']}, {$validated['lat']}), 4326)::geography");

        $venue = Venue::create([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'location' => $location,
            'district' => $validated['district'],
            'venue_type' => $validated['venue_type'],
            'halal_status' => $validated['halal_status'],
            'price_range' => $validated['price_range'],
            'cuisine_tags' => $validated['cuisine_tags'] ?? [],
            'google_place_id' => $validated['google_place_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Venue created.',
            'data' => VenueResource::make($venue->fresh()),
        ], 201);
    }

    public function show(Venue $venue): JsonResponse
    {
        $venue->loadCount('photos');

        return response()->json([
            'data' => array_merge(
                VenueResource::make($venue)->toArray(request()),
                ['photos_count' => $venue->photos_count],
            ),
        ]);
    }

    public function update(Request $request, Venue $venue): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string'],
            'lat' => ['sometimes', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'numeric', 'between:-180,180'],
            'district' => ['sometimes', 'string', 'max:255'],
            'venue_type' => ['sometimes', Rule::in(Venue::VENUE_TYPES)],
            'halal_status' => ['sometimes', Rule::in(['halal', 'non_halal', 'muslim_friendly', 'unknown'])],
            'price_range' => ['sometimes', 'integer', 'between:1,3'],
            'cuisine_tags' => ['sometimes', 'nullable', 'array'],
            'cuisine_tags.*' => ['string', 'max:100'],
            'google_place_id' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $updateData = collect($validated)->except(['lat', 'lng'])->toArray();

        if (array_key_exists('lat', $validated) || array_key_exists('lng', $validated)) {
            $currentLocation = VenueResource::make($venue->fresh())->toArray(request());
            $lat = $validated['lat'] ?? $currentLocation['location']['lat'];
            $lng = $validated['lng'] ?? $currentLocation['location']['lng'];
            $updateData['location'] = DB::raw("ST_SetSRID(ST_MakePoint({$lng}, {$lat}), 4326)::geography");
        }

        if (array_key_exists('cuisine_tags', $updateData)) {
            $updateData['cuisine_tags'] = $validated['cuisine_tags'] ?? [];
        }

        $venue->update($updateData);

        return response()->json([
            'message' => 'Venue updated.',
            'data' => VenueResource::make($venue->fresh()),
        ]);
    }

    public function destroy(Venue $venue): JsonResponse
    {
        $venue->delete();

        return response()->json(['message' => 'Venue deleted.']);
    }
}

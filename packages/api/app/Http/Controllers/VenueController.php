<?php

namespace App\Http\Controllers;

use App\Http\Requests\Venue\VenueSearchRequest;
use App\Http\Requests\Venue\VenueSuggestRequest;
use App\Http\Resources\VenueResource;
use App\Models\Venue;
use App\Services\GooglePlacesService;
use App\Services\IntegrationService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VenueController extends Controller
{
    public function __construct(
        private SettingsService $settings,
        private IntegrationService $integrations,
        private GooglePlacesService $googlePlaces,
    ) {}

    public function search(VenueSearchRequest $request): JsonResponse
    {
        $query = $request->validated('q');

        $dbVenues = Venue::searchByName($query)
            ->withCount('photos')
            ->limit(20)
            ->get();

        $googleResults = [];

        if ($this->integrations->enabled('google_maps') && $dbVenues->count() === 0) {
            try {
                $googleResults = $this->googlePlaces->autocomplete($query);
            } catch (\Throwable) {
                $googleResults = [];
            }
        }

        return response()->json([
            'data' => VenueResource::collection($dbVenues)->toArray($request),
            'google' => $googleResults,
        ]);
    }

    public function show(Venue $venue): VenueResource
    {
        $venue->loadCount('photos');

        return VenueResource::make($venue);
    }

    public function googleLookup(Request $request): JsonResponse
    {
        if (! $this->integrations->enabled('google_maps')) {
            return response()->json(['message' => 'Google Maps integration is not enabled.'], 403);
        }

        $validated = $request->validate([
            'place_id' => ['required', 'string', 'max:255'],
        ]);

        $existing = Venue::where('google_place_id', $validated['place_id'])->first();

        if ($existing) {
            return response()->json([
                'exists' => true,
                'venue' => VenueResource::make($existing->loadCount('photos'))->resolve($request),
            ]);
        }

        try {
            $details = $this->googlePlaces->getPlaceDetails($validated['place_id']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'exists' => false,
            'details' => $details,
        ]);
    }

    public function suggest(VenueSuggestRequest $request): JsonResponse
    {
        if (! $this->settings->bool('venue_suggestions_enabled', true)) {
            return response()->json(['message' => 'Venue suggestions are currently disabled.'], 403);
        }

        $data = $request->validated();

        if (! empty($data['google_place_id'])) {
            $existing = Venue::where('google_place_id', $data['google_place_id'])->first();
            if ($existing) {
                return response()->json([
                    'message' => 'This venue already exists.',
                    'venue' => VenueResource::make($existing),
                ]);
            }
        }

        $venue = Venue::create([
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'district' => $data['district'],
            'location' => DB::raw("ST_SetSRID(ST_MakePoint({$data['lng']}, {$data['lat']}), 4326)::geography"),
            'venue_type' => $data['venue_type'] ?? 'restaurant',
            'cuisine_tags' => $data['cuisine_tags'] ?? [],
            'price_range' => $data['price_range'] ?? 1,
            'halal_status' => $data['halal_status'] ?? 'unknown',
            'first_submitted_by' => $request->user()->id,
            'google_place_id' => $data['google_place_id'] ?? null,
        ]);

        $venue->refresh();

        return response()->json([
            'message' => 'Venue suggestion created. It will be reviewed before going live.',
            'venue' => VenueResource::make($venue),
        ], 201);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\Photo\PhotoUploadRequest;
use App\Http\Resources\PhotoResource;
use App\Jobs\ProcessPhotoJob;
use App\Models\Photo;
use App\Models\Venue;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function upload(PhotoUploadRequest $request): JsonResponse
    {
        if (! $this->settings->bool('photo_upload_enabled', true)) {
            return response()->json(['message' => 'Photo uploads are currently disabled.'], 403);
        }

        $validated = $request->validated();
        $user = $request->user();

        $venue = $this->resolveVenue($validated, $user->id);

        if ($venue === null) {
            return response()->json([
                'message' => 'Either venue_id or venue suggestion data is required.',
            ], 422);
        }

        $photo = DB::transaction(function () use ($request, $validated, $user, $venue) {
            $uploadedFile = $request->file('photo');

            $photo = Photo::create([
                'venue_id' => $venue->id,
                'submitter_id' => $user->id,
                'category' => $validated['category'],
                'secondary_tags' => $validated['secondary_tags'] ?? [],
                'status' => 'pending',
                'client_censored' => $validated['client_censored'] ?? false,
                'original_url' => 'pending',
            ]);

            $rawPath = "raw/{$photo->id}.jpg";
            Storage::disk($this->storageDisk())->putFileAs(
                'raw',
                $uploadedFile,
                "{$photo->id}.jpg"
            );

            $photo->update(['original_url' => $rawPath]);

            return $photo;
        });

        ProcessPhotoJob::dispatch($photo->id);

        return response()->json([
            'message' => 'Photo uploaded and queued for processing.',
            'photo' => PhotoResource::make($photo->refresh()),
        ], 202);
    }

    public function index(Request $request): JsonResponse
    {
        $photos = $request->user()
            ->photos()
            ->with(['venue'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => PhotoResource::collection($photos),
            'meta' => [
                'current_page' => $photos->currentPage(),
                'last_page' => $photos->lastPage(),
                'per_page' => $photos->perPage(),
                'total' => $photos->total(),
            ],
        ]);
    }

    public function show(Photo $photo): JsonResponse
    {
        $photo->load(['venue', 'submitter']);

        return response()->json([
            'photo' => PhotoResource::make($photo),
        ]);
    }

    private function resolveVenue(array $validated, int $userId): ?Venue
    {
        if (! empty($validated['venue_id'])) {
            return Venue::find($validated['venue_id']);
        }

        if (! empty($validated['venue'])) {
            $venueData = $validated['venue'];

            return Venue::create([
                'name' => $venueData['name'],
                'address' => $venueData['address'] ?? null,
                'district' => $venueData['district'],
                'location' => DB::raw("ST_SetSRID(ST_MakePoint({$venueData['lng']}, {$venueData['lat']}), 4326)::geography"),
                'venue_type' => $venueData['venue_type'] ?? 'restaurant',
                'cuisine_tags' => $venueData['cuisine_tags'] ?? [],
                'price_range' => $venueData['price_range'] ?? 1,
                'halal_status' => $venueData['halal_status'] ?? 'unknown',
                'first_submitted_by' => $userId,
            ])->refresh();
        }

        return null;
    }

    private function storageDisk(): string
    {
        return config('filesystems.default', 'local');
    }
}

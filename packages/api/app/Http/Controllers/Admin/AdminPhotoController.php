<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhotoResource;
use App\Models\Photo;
use App\Services\Game\SubmitterXpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPhotoController extends Controller
{
    public function __construct(
        private SubmitterXpService $xpService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Photo::query()->with(['venue', 'submitter'])->latest();

        if ($status = $request->string('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->string('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('needs_human_review')) {
            $query->where('needs_human_review', true);
        }

        if ($request->boolean('client_censored')) {
            $query->where('client_censored', true);
        }

        if ($search = $request->string('search')) {
            $query->whereHas('venue', fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
                ->orWhereHas('submitter', fn ($q) => $q->where('username', 'ILIKE', "%{$search}%"));
        }

        $photos = $query->paginate(25);

        return response()->json([
            'data' => $photos->through(fn (Photo $photo) => array_merge(
                PhotoResource::make($photo)->toArray($request),
                [
                    'original_url' => $photo->original_url,
                    'auto_category' => $photo->auto_category,
                    'needs_human_review' => $photo->needs_human_review,
                    'client_censored' => $photo->client_censored,
                    'updated_at' => $photo->updated_at,
                ],
            )),
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
            'data' => array_merge(
                PhotoResource::make($photo)->toArray(request()),
                [
                    'original_url' => $photo->original_url,
                    'auto_category' => $photo->auto_category,
                    'auto_category_confidence' => $photo->auto_category_confidence,
                    'needs_human_review' => $photo->needs_human_review,
                    'client_censored' => $photo->client_censored,
                    'secondary_tags' => $photo->secondary_tags,
                    'server_flags' => $photo->server_flags,
                    'updated_at' => $photo->updated_at,
                ],
            ),
        ]);
    }

    public function update(Request $request, Photo $photo): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['sometimes', Rule::in(Photo::CATEGORIES)],
            'status' => ['sometimes', Rule::in(Photo::STATUSES)],
            'needs_human_review' => ['sometimes', 'boolean'],
        ]);

        $photo->update($validated);

        return response()->json([
            'message' => 'Photo updated.',
            'data' => PhotoResource::make($photo->refresh()),
        ]);
    }

    public function quarantine(Request $request, Photo $photo): JsonResponse
    {
        if ($photo->status === 'quarantined') {
            return response()->json(['message' => 'Photo is already quarantined.'], 422);
        }

        $photo->update([
            'status' => 'quarantined',
            'needs_human_review' => true,
        ]);

        return response()->json([
            'message' => 'Photo quarantined.',
            'data' => PhotoResource::make($photo->refresh()),
        ]);
    }
}

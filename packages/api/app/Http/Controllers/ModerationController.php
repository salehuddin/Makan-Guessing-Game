<?php

namespace App\Http\Controllers;

use App\Http\Resources\PhotoResource;
use App\Models\Photo;
use App\Services\Game\SubmitterXpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function __construct(
        private SubmitterXpService $xpService,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        $photos = Photo::where('status', 'quarantined')
            ->orWhere('status', 'pending')
            ->with(['venue', 'submitter'])
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

    public function approve(Request $request, Photo $photo): JsonResponse
    {
        if ($photo->status === 'approved') {
            return response()->json(['message' => 'Photo is already approved.'], 422);
        }

        if (! $photo->censored_url) {
            $photo->update(['censored_url' => $photo->original_url]);
        }

        $photo->update([
            'status' => 'approved',
            'needs_human_review' => false,
        ]);

        $xpAwarded = $this->xpService->awardForApproval($photo);

        return response()->json([
            'message' => 'Photo approved.',
            'photo' => PhotoResource::make($photo->refresh()),
            'xp_awarded' => $xpAwarded,
        ]);
    }

    public function reject(Request $request, Photo $photo): JsonResponse
    {
        if (in_array($photo->status, ['rejected'])) {
            return response()->json(['message' => 'Photo is already rejected.'], 422);
        }

        $validated = $request->validate([
            'reason' => ['sometimes', 'string', 'max:500'],
        ]);

        $photo->update([
            'status' => 'rejected',
            'needs_human_review' => false,
        ]);

        $this->xpService->penalizeForRejection($photo);

        return response()->json([
            'message' => 'Photo rejected.',
            'photo' => PhotoResource::make($photo->refresh()),
        ]);
    }
}

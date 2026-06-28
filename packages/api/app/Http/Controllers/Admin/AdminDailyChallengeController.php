<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyChallenge;
use App\Services\Game\DailyChallengeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDailyChallengeController extends Controller
{
    public function __construct(
        private DailyChallengeGenerator $generator,
    ) {}

    public function index(): JsonResponse
    {
        $challenges = DailyChallenge::withCount('photos')
            ->orderByDesc('date')
            ->paginate(25);

        return response()->json([
            'data' => $challenges->through(fn (DailyChallenge $challenge) => [
                'id' => $challenge->id,
                'date' => $challenge->date,
                'title' => $challenge->title,
                'status' => $challenge->status,
                'photos_count' => $challenge->photos_count,
                'published_at' => $challenge->published_at,
                'created_at' => $challenge->created_at,
            ]),
            'meta' => [
                'current_page' => $challenges->currentPage(),
                'last_page' => $challenges->lastPage(),
                'per_page' => $challenges->perPage(),
                'total' => $challenges->total(),
            ],
        ]);
    }

    public function show(DailyChallenge $challenge): JsonResponse
    {
        $challenge->load(['photos.photo.venue', 'photos.photo.submitter']);

        return response()->json([
            'data' => [
                'id' => $challenge->id,
                'date' => $challenge->date,
                'title' => $challenge->title,
                'status' => $challenge->status,
                'published_at' => $challenge->published_at,
                'created_at' => $challenge->created_at,
                'can_be_edited' => $challenge->canBeEdited(),
                'photos' => $challenge->photos->map(fn ($p) => [
                    'id' => $p->id,
                    'position' => $p->position,
                    'photo' => $p->photo ? [
                        'id' => $p->photo->id,
                        'category' => $p->photo->category,
                        'censored_url' => $p->photo->censored_url,
                        'status' => $p->photo->status,
                        'venue' => $p->photo->venue ? [
                            'id' => $p->photo->venue->id,
                            'name' => $p->photo->venue->name,
                        ] : null,
                    ] : null,
                ]),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'unique:daily_challenges,date'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $challenge = $this->generator->generateDraft(
            $validated['date'],
            $request->user()?->id,
        );

        if (! empty($validated['title'])) {
            $challenge->update(['title' => $validated['title']]);
        }

        return response()->json([
            'message' => 'Daily challenge created.',
            'data' => [
                'id' => $challenge->id,
                'date' => $challenge->date,
                'status' => $challenge->status,
                'photos_count' => $challenge->photos->count(),
            ],
        ], 201);
    }

    public function update(Request $request, DailyChallenge $challenge): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(DailyChallenge::STATUSES)],
        ]);

        if (isset($validated['status']) && $validated['status'] === 'published' && $challenge->photos()->count() === 0) {
            return response()->json(['message' => 'Cannot publish a challenge with no photos.'], 422);
        }

        $challenge->update($validated);

        return response()->json([
            'message' => 'Daily challenge updated.',
            'data' => [
                'id' => $challenge->id,
                'date' => $challenge->date,
                'title' => $challenge->title,
                'status' => $challenge->status,
            ],
        ]);
    }

    public function generate(DailyChallenge $challenge): JsonResponse
    {
        $this->generator->regeneratePhotos($challenge);

        return response()->json([
            'message' => 'Photos regenerated.',
            'photos_count' => $challenge->photos()->count(),
        ]);
    }

    public function publish(DailyChallenge $challenge): JsonResponse
    {
        if ($challenge->photos()->count() === 0) {
            return response()->json(['message' => 'Cannot publish a challenge with no photos.'], 422);
        }

        $this->generator->publish($challenge);

        return response()->json([
            'message' => 'Daily challenge published.',
            'data' => [
                'id' => $challenge->id,
                'status' => 'published',
                'published_at' => $challenge->published_at,
            ],
        ]);
    }

    public function destroy(DailyChallenge $challenge): JsonResponse
    {
        $challenge->delete();

        return response()->json(['message' => 'Daily challenge deleted.']);
    }
}

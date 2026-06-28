<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->withCount(['photos', 'guesses']);

        if ($search = $request->string('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('username', 'ILIKE', "%{$search}%")
                    ->orWhere('email', 'ILIKE', "%{$search}%")
                    ->orWhere('phone', 'ILIKE', "%{$search}%");
            });
        }

        if ($tier = $request->string('trust_tier')) {
            $query->where('trust_tier', $tier);
        }

        if ($request->has('is_admin')) {
            $query->where('is_admin', $request->boolean('is_admin'));
        }

        $users = $query->latest()->paginate(25);

        return response()->json([
            'data' => $users->through(fn (User $user) => [
                'id' => $user->id,
                'username' => $user->username,
                'phone' => $user->phone,
                'email' => $user->email,
                'trust_tier' => $user->trust_tier,
                'is_admin' => $user->is_admin,
                'xp_total' => $user->xp_total,
                'guesser_score_total' => $user->guesser_score_total,
                'guesses_played_count' => $user->guesses_played_count,
                'correct_guesses_count' => $user->correct_guesses_count,
                'best_guess_streak' => $user->best_guess_streak,
                'guesser_streak' => $user->guesser_streak,
                'submitter_streak' => $user->submitter_streak,
                'approved_count' => $user->approved_count,
                'rejected_count' => $user->rejected_count,
                'district' => $user->district,
                'photos_count' => $user->photos_count,
                'guesses_count' => $user->guesses_count,
                'created_at' => $user->created_at,
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $user->loadCount(['photos', 'guesses']);

        $photos = $user->photos()
            ->with(['venue:id,name,district'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($photo) => [
                'id' => $photo->id,
                'category' => $photo->category,
                'status' => $photo->status,
                'censored_url' => $photo->censored_url,
                'venue' => $photo->venue ? [
                    'id' => $photo->venue->id,
                    'name' => $photo->venue->name,
                    'district' => $photo->venue->district,
                ] : null,
                'total_guesses' => $photo->total_guesses,
                'created_at' => $photo->created_at,
            ]);

        $guesses = $user->guesses()
            ->with(['photo:id,category,censored_url,venue_id', 'photo.venue:id,name', 'guessedVenue:id,name'])
            ->latest('answered_at')
            ->limit(20)
            ->get()
            ->map(fn ($guess) => [
                'id' => $guess->id,
                'is_correct_name' => $guess->is_correct_name,
                'score' => $guess->score,
                'time_ms' => $guess->time_ms,
                'distance_meters' => $guess->distance_meters,
                'game_mode_slug' => $guess->game_mode_slug,
                'answered_at' => $guess->answered_at,
                'photo' => $guess->photo ? [
                    'id' => $guess->photo->id,
                    'category' => $guess->photo->category,
                    'censored_url' => $guess->photo->censored_url,
                    'venue' => $guess->photo->venue ? [
                        'id' => $guess->photo->venue->id,
                        'name' => $guess->photo->venue->name,
                    ] : null,
                ] : null,
                'guessed_venue' => $guess->guessedVenue ? [
                    'id' => $guess->guessedVenue->id,
                    'name' => $guess->guessedVenue->name,
                ] : null,
            ]);

        $xpEvents = $user->xpEvents()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($event) => [
                'id' => $event->id,
                'type' => $event->type,
                'amount' => $event->amount,
                'breakdown' => $event->breakdown,
                'created_at' => $event->created_at,
            ]);

        $socialAccounts = $user->socialAccounts()
            ->get()
            ->map(fn ($account) => [
                'id' => $account->id,
                'provider' => $account->provider,
                'provider_id' => $account->provider_id,
                'created_at' => $account->created_at,
            ]);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'phone' => $user->phone,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'phone_verified_at' => $user->phone_verified_at,
                'trust_tier' => $user->trust_tier,
                'is_admin' => $user->is_admin,
                'xp_total' => $user->xp_total,
                'guesser_score_total' => $user->guesser_score_total,
                'guesses_played_count' => $user->guesses_played_count,
                'correct_guesses_count' => $user->correct_guesses_count,
                'best_guess_streak' => $user->best_guess_streak,
                'guesser_streak' => $user->guesser_streak,
                'submitter_streak' => $user->submitter_streak,
                'approved_count' => $user->approved_count,
                'rejected_count' => $user->rejected_count,
                'district' => $user->district,
                'photos_count' => $user->photos_count,
                'guesses_count' => $user->guesses_count,
                'created_at' => $user->created_at,
                'photos' => $photos,
                'guesses' => $guesses,
                'xp_events' => $xpEvents,
                'social_accounts' => $socialAccounts,
            ],
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['sometimes', 'string', 'max:50'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'trust_tier' => ['sometimes', Rule::in(['new', 'verified', 'trusted', 'curator'])],
            'is_admin' => ['sometimes', 'boolean'],
            'xp_total' => ['sometimes', 'integer', 'min:0'],
            'district' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated.',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'phone' => $user->phone,
                'email' => $user->email,
                'trust_tier' => $user->trust_tier,
                'is_admin' => $user->is_admin,
                'xp_total' => $user->xp_total,
                'district' => $user->district,
            ],
        ]);
    }
}

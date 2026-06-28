<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGuessController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Guess::query()
            ->with(['photo.venue', 'guesser', 'guessedVenue', 'dailyChallenge'])
            ->latest('created_at');

        if ($request->has('is_correct_name')) {
            $query->where('is_correct_name', $request->boolean('is_correct_name'));
        }

        if ($mode = $request->string('game_mode_slug')) {
            $query->where('game_mode_slug', $mode);
        }

        if ($search = $request->string('search')) {
            $query->whereHas('guesser', fn ($q) => $q->where('username', 'ILIKE', "%{$search}%"))
                ->orWhereHas('photo.venue', fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"));
        }

        if ($from = $request->string('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->string('to')) {
            $query->where('created_at', '<=', $to);
        }

        $guesses = $query->paginate(25);

        return response()->json([
            'data' => $guesses->through(fn (Guess $guess) => [
                'id' => $guess->id,
                'guesser' => $guess->guesser ? [
                    'id' => $guess->guesser->id,
                    'username' => $guess->guesser->username,
                ] : null,
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
                'is_correct_name' => $guess->is_correct_name,
                'distance_meters' => $guess->distance_meters,
                'time_ms' => $guess->time_ms,
                'score' => $guess->score,
                'game_mode_slug' => $guess->game_mode_slug,
                'daily_challenge' => $guess->dailyChallenge ? [
                    'id' => $guess->dailyChallenge->id,
                    'date' => $guess->dailyChallenge->date,
                ] : null,
                'shown_option_ids' => $guess->shown_option_ids,
                'answered_at' => $guess->answered_at,
                'created_at' => $guess->created_at,
            ]),
            'meta' => [
                'current_page' => $guesses->currentPage(),
                'last_page' => $guesses->lastPage(),
                'per_page' => $guesses->perPage(),
                'total' => $guesses->total(),
            ],
        ]);
    }

    public function show(Guess $guess): JsonResponse
    {
        $guess->load(['photo.venue', 'guesser', 'guessedVenue', 'dailyChallenge']);

        return response()->json([
            'data' => [
                'id' => $guess->id,
                'guesser' => $guess->guesser ? [
                    'id' => $guess->guesser->id,
                    'username' => $guess->guesser->username,
                ] : null,
                'photo' => $guess->photo ? [
                    'id' => $guess->photo->id,
                    'category' => $guess->photo->category,
                    'censored_url' => $guess->photo->censored_url,
                    'original_url' => $guess->photo->original_url,
                    'venue' => $guess->photo->venue ? [
                        'id' => $guess->photo->venue->id,
                        'name' => $guess->photo->venue->name,
                        'district' => $guess->photo->venue->district,
                    ] : null,
                ] : null,
                'guessed_venue' => $guess->guessedVenue ? [
                    'id' => $guess->guessedVenue->id,
                    'name' => $guess->guessedVenue->name,
                ] : null,
                'is_correct_name' => $guess->is_correct_name,
                'distance_meters' => $guess->distance_meters,
                'time_ms' => $guess->time_ms,
                'score' => $guess->score,
                'game_mode_slug' => $guess->game_mode_slug,
                'daily_challenge' => $guess->dailyChallenge ? [
                    'id' => $guess->dailyChallenge->id,
                    'date' => $guess->dailyChallenge->date,
                ] : null,
                'shown_option_ids' => $guess->shown_option_ids,
                'answered_at' => $guess->answered_at,
                'created_at' => $guess->created_at,
            ],
        ]);
    }
}

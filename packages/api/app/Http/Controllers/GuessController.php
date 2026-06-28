<?php

namespace App\Http\Controllers;

use App\Models\Guess;
use App\Models\Photo;
use App\Services\Game\GuesserScoringService;
use App\Services\Game\GuessStatsService;
use App\Services\Game\SubmitterXpService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuessController extends Controller
{
    public function __construct(
        private GuesserScoringService $scoringService,
        private GuessStatsService $guessStatsService,
        private SubmitterXpService $submitterXpService,
        private SettingsService $settings,
    ) {}

    public function submit(Request $request): JsonResponse
    {
        if (! $this->settings->bool('classic_guess_enabled', true)) {
            return response()->json(['message' => 'Classic Guess is currently disabled.'], 403);
        }

        $validated = $request->validate([
            'photo_id' => ['required', 'uuid', 'exists:photos,id'],
            'guessed_venue_id' => ['required', 'uuid', 'exists:venues,id'],
            'time_ms' => ['required', 'integer', 'min:0', 'max:300000'],
        ]);

        $user = $request->user();
        $photo = Photo::with('venue')->findOrFail($validated['photo_id']);

        if ($photo->status !== 'approved') {
            return response()->json(['message' => 'This photo is not available for guessing.'], 422);
        }

        $alreadyGuessed = Guess::where('photo_id', $photo->id)
            ->where('guesser_id', $user->id)
            ->exists();

        if ($alreadyGuessed) {
            return response()->json(['message' => 'You have already guessed this photo.'], 422);
        }

        $isCorrect = $photo->venue_id === $validated['guessed_venue_id'];

        $consecutiveCorrect = Guess::where('guesser_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->takeWhile(fn ($g) => $g->is_correct_name)
            ->count();

        $breakdown = $this->scoringService->calculate(
            $photo,
            $isCorrect,
            $validated['time_ms'],
            $consecutiveCorrect,
        );

        $venueLocation = DB::selectOne(
            'SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM venues WHERE id = ?',
            [$photo->venue_id]
        );

        $guess = Guess::create([
            'photo_id' => $photo->id,
            'guesser_id' => $user->id,
            'guessed_venue_id' => $validated['guessed_venue_id'],
            'actual_pin' => DB::raw("ST_SetSRID(ST_MakePoint({$venueLocation->lng}, {$venueLocation->lat}), 4326)::geography"),
            'distance_meters' => null,
            'time_ms' => $validated['time_ms'],
            'is_correct_name' => $isCorrect,
            'score' => $breakdown['total'],
            'game_mode_slug' => 'classic',
            'answered_at' => now(),
        ]);

        $newStreak = $isCorrect ? $consecutiveCorrect + 1 : 0;
        $this->guessStatsService->record($guess, $photo, $user, $isCorrect, $newStreak);

        if ($photo->submitter_id !== $user->id) {
            $this->submitterXpService->awardEngagementDividend($photo, $guess->id);
        }

        return response()->json([
            'guess_id' => $guess->id,
            'is_correct_name' => $isCorrect,
            'score' => $breakdown['total'],
            'breakdown' => $breakdown,
            'streak' => $newStreak,
            'correct_venue_id' => $photo->venue_id,
            'correct_venue_name' => $photo->venue->name,
        ]);
    }
}

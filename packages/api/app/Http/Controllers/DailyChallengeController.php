<?php

namespace App\Http\Controllers;

use App\Models\Guess;
use App\Models\Photo;
use App\Services\Game\DailyChallengeGenerator;
use App\Services\Game\DistractorService;
use App\Services\Game\GuesserScoringService;
use App\Services\Game\GuessStatsService;
use App\Services\Game\SubmitterXpService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyChallengeController extends Controller
{
    public function __construct(
        private DailyChallengeGenerator $generator,
        private DistractorService $distractorService,
        private GuesserScoringService $scoringService,
        private GuessStatsService $guessStatsService,
        private SubmitterXpService $submitterXpService,
        private SettingsService $settings,
    ) {}

    public function show(Request $request): JsonResponse
    {
        if (! $this->settings->bool('daily_challenge_enabled', true)) {
            return response()->json(['message' => 'Daily Challenge is currently disabled.'], 403);
        }

        $challenge = $this->generator->getPublishedForDate(now());

        if ($challenge === null) {
            return response()->json([
                'message' => 'No Daily Challenge is published for today. Please check back later.',
            ], 404);
        }

        $optionCount = $this->settings->int('classic_option_count', 4);
        $showSubmitter = $this->settings->bool('show_submitter_credit', true);
        $showCategory = $this->settings->bool('show_category_tag', true);

        $user = $request->user();

        $guessedIds = Guess::where('guesser_id', $user->id)
            ->whereIn('photo_id', $challenge->photos->pluck('photo_id'))
            ->pluck('photo_id')
            ->toArray();

        $challengeData = $challenge->photos->map(function ($row) use ($optionCount, $showSubmitter, $showCategory, $guessedIds) {
            $photo = $row->photo;

            $distractors = $this->distractorService->generate(
                $photo->venue_id,
                $photo->venue->district,
                max(0, $optionCount - 1),
            );

            $options = $distractors->concat([$photo->venue])
                ->shuffle()
                ->map(fn ($venue) => [
                    'id' => $venue->id,
                    'name' => $venue->name,
                ])
                ->values();

            $photoData = [
                'id' => $photo->id,
                'censored_url' => $photo->censored_url,
                'thumbnail_url' => $photo->thumbnail_url,
            ];

            if ($showCategory) {
                $photoData['category'] = $photo->category;
            }
            if ($showSubmitter) {
                $photoData['submitter'] = $photo->submitter->username;
            }

            return [
                'photo' => $photoData,
                'options' => $options,
                'already_guessed' => in_array($photo->id, $guessedIds, true),
            ];
        });

        return response()->json([
            'date' => $challenge->date->format('Y-m-d'),
            'challenge' => $challengeData,
            'total_photos' => $challenge->photos->count(),
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        if (! $this->settings->bool('daily_challenge_enabled', true)) {
            return response()->json(['message' => 'Daily Challenge is currently disabled.'], 403);
        }

        $validated = $request->validate([
            'photo_id' => ['required', 'uuid', 'exists:photos,id'],
            'guessed_venue_id' => ['required', 'uuid', 'exists:venues,id'],
            'time_ms' => ['required', 'integer', 'min:0', 'max:300000'],
        ]);

        $challenge = $this->generator->getPublishedForDate(now());

        if ($challenge === null) {
            return response()->json(['message' => 'No Daily Challenge is published for today.'], 404);
        }

        $user = $request->user();

        $challengePhoto = $challenge->photos->firstWhere('photo_id', $validated['photo_id']);

        if ($challengePhoto === null) {
            return response()->json(['message' => 'This photo is not part of today\'s challenge.'], 422);
        }

        $photo = Photo::with('venue')->findOrFail($validated['photo_id']);

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
            'time_ms' => $validated['time_ms'],
            'is_correct_name' => $isCorrect,
            'score' => $breakdown['total'],
            'game_mode_slug' => 'daily',
            'daily_challenge_id' => $challenge->id,
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyChallenge;
use App\Models\Photo;
use App\Models\Venue;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function stats(): JsonResponse
    {
        $pending = Photo::whereIn('status', ['pending', 'quarantined'])->count();
        $quarantined = Photo::where('status', 'quarantined')->count();

        $playablePhotos = Photo::approved()
            ->whereNotNull('censored_url')
            ->count();

        $totalVenues = Venue::count();
        $venuesWithPhotos = Venue::whereHas('photos', fn ($q) => $q->where('status', 'approved'))->count();

        $neverGuessed = Photo::approved()
            ->whereNotNull('censored_url')
            ->where('total_guesses', 0)
            ->count();

        $today = now()->format('Y-m-d');
        $challengeToday = DailyChallenge::where('date', $today)->first();

        $classicEnabled = $this->settings->bool('classic_guess_enabled', true);
        $dailyEnabled = $this->settings->bool('daily_challenge_enabled', true);

        $categoryCoverage = [];
        foreach (Photo::CATEGORIES as $category) {
            $categoryCoverage[$category] = Photo::approved()
                ->where('category', $category)
                ->whereNotNull('censored_url')
                ->count();
        }

        $coveredCategories = collect($categoryCoverage)->filter(fn ($c) => $c >= 10)->count();

        return response()->json([
            'data' => [
                'pending_moderation' => $pending,
                'quarantined' => $quarantined,
                'playable_photos' => $playablePhotos,
                'total_venues' => $totalVenues,
                'venues_with_photos' => $venuesWithPhotos,
                'never_guessed' => $neverGuessed,
                'challenge_today' => $challengeToday ? [
                    'id' => $challengeToday->id,
                    'status' => $challengeToday->status,
                    'title' => $challengeToday->title,
                ] : null,
                'modes' => [
                    'classic_enabled' => $classicEnabled,
                    'daily_enabled' => $dailyEnabled,
                ],
                'category_coverage' => $categoryCoverage,
                'categories_covered' => $coveredCategories,
                'categories_total' => count(Photo::CATEGORIES),
            ],
        ]);
    }
}

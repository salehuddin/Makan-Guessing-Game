<?php

namespace App\Http\Controllers;

use App\Models\AdView;
use App\Models\Guess;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdController extends Controller
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function rewardedCallback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guess_id' => ['required', 'uuid', 'exists:guesses,id'],
            'reward_type' => ['required', 'in:streak_freeze,double_xp'],
            'platform' => ['required', 'in:web,mobile'],
            'ad_unit_id' => ['nullable', 'string', 'max:200'],
            'network' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $guess = Guess::where('id', $validated['guess_id'])
            ->where('guesser_id', $user->id)
            ->first();

        if ($guess === null) {
            return response()->json(['message' => 'Guess not found for this user.'], 404);
        }

        $rewardType = $validated['reward_type'];
        $settingKey = $rewardType === 'streak_freeze' ? 'ads_rewarded_streak_freeze' : 'ads_rewarded_double_xp';

        if (! $this->settings->bool($settingKey, true)) {
            return response()->json(['message' => 'This rewarded ad feature is disabled.'], 403);
        }

        $alreadyRewarded = AdView::where('user_id', $user->id)
            ->where('guess_id', $guess->id)
            ->where('reward_type', $rewardType)
            ->exists();

        if ($alreadyRewarded) {
            return response()->json(['message' => 'Reward already claimed for this guess.'], 422);
        }

        $rewardAmount = 0;

        if ($rewardType === 'streak_freeze') {
            if ($guess->is_correct_name) {
                return response()->json(['message' => 'Streak freeze is only available for incorrect guesses.'], 422);
            }

            $consecutiveCorrect = Guess::where('guesser_id', $user->id)
                ->where('id', '!=', $guess->id)
                ->where('created_at', '<', $guess->created_at)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->takeWhile(fn ($g) => $g->is_correct_name)
                ->count();

            $user->update(['guesser_streak' => $consecutiveCorrect]);
            $rewardAmount = $consecutiveCorrect;
        } else {
            if (! $guess->is_correct_name) {
                return response()->json(['message' => 'Double XP is only available for correct guesses.'], 422);
            }

            $bonusScore = $guess->score;
            $user->increment('guesser_score_total', $bonusScore);
            $guess->update(['score' => $guess->score + $bonusScore]);
            $rewardAmount = $bonusScore;
        }

        AdView::create([
            'user_id' => $user->id,
            'platform' => $validated['platform'],
            'ad_type' => 'rewarded',
            'placement' => 'post_guess',
            'reward_type' => $rewardType,
            'guess_id' => $guess->id,
            'reward_amount' => $rewardAmount,
            'ad_unit_id' => $validated['ad_unit_id'] ?? null,
            'network' => $validated['network'] ?? null,
        ]);

        $user->refresh();

        return response()->json([
            'message' => 'Reward applied successfully.',
            'reward_type' => $rewardType,
            'reward_amount' => $rewardAmount,
            'guesser_streak' => $user->guesser_streak,
            'guesser_score_total' => $user->guesser_score_total,
        ]);
    }
}

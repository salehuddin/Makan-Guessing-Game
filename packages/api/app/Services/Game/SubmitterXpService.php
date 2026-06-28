<?php

namespace App\Services\Game;

use App\Models\Photo;
use App\Models\User;
use App\Models\XpEvent;
use App\Services\Photo\PHashService;
use Illuminate\Support\Facades\Log;

class SubmitterXpService
{
    public function awardForApproval(Photo $photo): int
    {
        $submitter = $photo->submitter;
        $bonuses = $this->calculateBonuses($photo);

        $base = 50;
        $pioneerBonus = $bonuses['pioneer'] ? 200 : 0;
        $categoryPioneerBonus = $bonuses['category_pioneer'] ? 100 : 0;
        $freshAngleBonus = $bonuses['fresh_angle'] ? 30 : 0;
        $coverageGapBonus = $bonuses['coverage_gap'] ? 100 : 0;
        $categoryGapBonus = $bonuses['category_gap'] ? 50 : 0;

        $subtotal = $base + $pioneerBonus + $categoryPioneerBonus + $freshAngleBonus + $coverageGapBonus + $categoryGapBonus;

        $multiplier = $this->approvalStreakMultiplier($submitter->submitter_streak);
        $total = (int) round($subtotal * $multiplier);

        $submitter->increment('xp_total', $total);
        $submitter->increment('approved_count');
        $submitter->increment('submitter_streak');

        $this->updateTrustTier($submitter);

        XpEvent::create([
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'type' => 'photo_approved',
            'amount' => $total,
            'breakdown' => [
                'base' => $base,
                'pioneer_bonus' => $pioneerBonus,
                'category_pioneer_bonus' => $categoryPioneerBonus,
                'fresh_angle_bonus' => $freshAngleBonus,
                'coverage_gap_bonus' => $coverageGapBonus,
                'category_gap_bonus' => $categoryGapBonus,
                'streak_multiplier' => $multiplier,
            ],
        ]);

        Log::info('Submitter XP awarded', [
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'base' => $base,
            'pioneer_bonus' => $pioneerBonus,
            'category_pioneer_bonus' => $categoryPioneerBonus,
            'fresh_angle_bonus' => $freshAngleBonus,
            'coverage_gap_bonus' => $coverageGapBonus,
            'category_gap_bonus' => $categoryGapBonus,
            'multiplier' => $multiplier,
            'total' => $total,
        ]);

        return $total;
    }

    public function penalizeForRejection(Photo $photo): void
    {
        $submitter = $photo->submitter;

        $submitter->increment('rejected_count');
        $submitter->update(['submitter_streak' => 0]);

        $this->updateTrustTier($submitter);
    }

    private function calculateBonuses(Photo $photo): array
    {
        $isPioneer = ! Photo::where('venue_id', $photo->venue_id)
            ->where('id', '!=', $photo->id)
            ->where('status', 'approved')
            ->exists();

        $isCategoryPioneer = ! Photo::where('venue_id', $photo->venue_id)
            ->where('id', '!=', $photo->id)
            ->where('category', $photo->category)
            ->where('status', 'approved')
            ->exists();

        $hasSimilarPhoto = $photo->phash !== null && Photo::where('venue_id', $photo->venue_id)
            ->where('id', '!=', $photo->id)
            ->whereNotNull('phash')
            ->where('status', 'approved')
            ->get(['phash'])
            ->contains(fn (Photo $existing) => app(PHashService::class)->isDuplicate($photo->phash, $existing->phash, 0.85));

        $districtApprovedPhotos = Photo::whereHas('venue', fn ($query) => $query->where('district', $photo->venue->district))
            ->where('id', '!=', $photo->id)
            ->where('status', 'approved')
            ->count();

        $categoryPhotosForVenue = Photo::where('venue_id', $photo->venue_id)
            ->where('id', '!=', $photo->id)
            ->where('category', $photo->category)
            ->where('status', 'approved')
            ->count();

        return [
            'pioneer' => $isPioneer,
            'category_pioneer' => $isCategoryPioneer,
            'fresh_angle' => $photo->phash !== null && ! $hasSimilarPhoto,
            'coverage_gap' => $districtApprovedPhotos < 10,
            'category_gap' => $categoryPhotosForVenue < 3,
        ];
    }

    public function awardEngagementDividend(Photo $photo, ?string $guessId = null): void
    {
        if ($photo->engagement_xp_awarded >= 200) {
            return;
        }

        $submitter = $photo->submitter;
        $awardedCount = $photo->engagement_xp_awarded + 1;

        $submitter->increment('xp_total');
        $photo->increment('engagement_xp_awarded');

        XpEvent::create([
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'guess_id' => $guessId,
            'type' => 'engagement_dividend',
            'amount' => 1,
            'breakdown' => [
                'photo_engagement_xp_awarded' => $awardedCount,
            ],
        ]);
    }

    private function approvalStreakMultiplier(int $streak): float
    {
        if ($streak < 0) {
            return 1.0;
        }
        if ($streak >= 20) {
            return 1.5;
        }
        if ($streak >= 10) {
            return 1.3;
        }
        if ($streak >= 5) {
            return 1.2;
        }
        if ($streak >= 2) {
            return 1.1;
        }

        return 1.0;
    }

    private function updateTrustTier(User $user): void
    {
        $approved = $user->approved_count;
        $rejected = $user->rejected_count;
        $rejectionRate = ($approved + $rejected) > 0 ? $rejected / ($approved + $rejected) : 0;

        if ($approved >= 200) {
            $tier = 'curator';
        } elseif ($approved >= 50 && $rejectionRate < 0.05) {
            $tier = 'trusted';
        } elseif ($approved >= 5 && $rejected === 0) {
            $tier = 'verified';
        } else {
            $tier = 'new';
        }

        if ($user->trust_tier !== $tier) {
            $user->update(['trust_tier' => $tier]);
        }
    }
}

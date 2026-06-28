<?php

namespace App\Services\Game;

use App\Models\Photo;

class GuesserScoringService
{
    public function calculate(Photo $photo, bool $isCorrect, int $timeMs, int $consecutiveCorrect): array
    {
        $base = $isCorrect ? 100 : 0;

        $speed = $this->speedMultiplier($timeMs, $photo->avg_guess_time_ms ?? 10000);
        $streak = $this->streakMultiplier($consecutiveCorrect);
        $difficulty = $this->difficultyMultiplier($photo);
        $category = $this->categoryMultiplier($photo->category);

        $total = (int) round($base * $speed * $streak * $difficulty * $category);

        return [
            'base' => $base,
            'speed_multiplier' => $speed,
            'streak_multiplier' => $streak,
            'difficulty_multiplier' => $difficulty,
            'category_multiplier' => $category,
            'map_bonus' => 0,
            'total' => $total,
        ];
    }

    private function speedMultiplier(int $timeMs, int $averageTimeMs): float
    {
        if ($averageTimeMs <= 0 || $timeMs <= 0) {
            return 1.0;
        }

        if ($timeMs >= $averageTimeMs) {
            return 1.0;
        }

        $ratio = 1 - ($timeMs / $averageTimeMs);

        return max(1.0, min(2.0, 1.0 + $ratio));
    }

    private function streakMultiplier(int $consecutiveCorrect): float
    {
        if ($consecutiveCorrect <= 0) {
            return 1.0;
        }

        return min(1.5, 1.0 + 0.05 * $consecutiveCorrect);
    }

    private function difficultyMultiplier(Photo $photo): float
    {
        if ($photo->total_guesses < 10) {
            return 1.5;
        }

        $accuracy = $photo->total_guesses > 0
            ? $photo->correct_guesses / $photo->total_guesses
            : 0.5;

        if ($accuracy < 0.1) {
            return 0.5;
        }

        if ($accuracy >= 0.3 && $accuracy <= 0.7) {
            return 1.5;
        }

        return 1.0;
    }

    private function categoryMultiplier(string $category): float
    {
        return match ($category) {
            'signature_dish' => 1.5,
            'ambience' => 1.2,
            'table_setting' => 1.3,
            'staff_uniforms' => 1.2,
            'menu_signage' => 1.1,
            'exterior' => 1.0,
            default => 1.0,
        };
    }
}

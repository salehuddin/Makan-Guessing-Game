<?php

namespace App\Services\Game;

use App\Models\Guess;
use App\Models\Photo;
use App\Models\User;

class GuessStatsService
{
    public function record(Guess $guess, Photo $photo, User $user, bool $isCorrect, int $newStreak): void
    {
        $photo->refresh();

        $totalGuesses = $photo->total_guesses + 1;
        $totalGuessTimeMs = $photo->total_guess_time_ms + $guess->time_ms;

        $photo->update([
            'total_guesses' => $totalGuesses,
            'total_guess_time_ms' => $totalGuessTimeMs,
            'avg_guess_time_ms' => (int) round($totalGuessTimeMs / $totalGuesses),
            'correct_guesses' => $photo->correct_guesses + ($isCorrect ? 1 : 0),
        ]);

        $user->refresh();

        $user->update([
            'guesser_score_total' => $user->guesser_score_total + $guess->score,
            'guesses_played_count' => $user->guesses_played_count + 1,
            'correct_guesses_count' => $user->correct_guesses_count + ($isCorrect ? 1 : 0),
            'guesser_streak' => $newStreak,
            'best_guess_streak' => max($user->best_guess_streak, $newStreak),
        ]);
    }
}

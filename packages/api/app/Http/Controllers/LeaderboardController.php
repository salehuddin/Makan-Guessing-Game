<?php

namespace App\Http\Controllers;

use App\Models\Guess;
use App\Models\User;
use App\Models\XpEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaderboardController extends Controller
{
    public function guessers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['nullable', 'in:all,weekly,monthly'],
            'district' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $period = $validated['period'] ?? 'all';
        $limit = $validated['limit'] ?? 50;

        $rows = $period === 'all' && empty($validated['district']) && empty($validated['category'])
            ? $this->allTimeGuessers($limit)
            : $this->periodGuessers($period, $limit, $validated['district'] ?? null, $validated['category'] ?? null);

        return response()->json(['data' => $this->rankRows($rows)]);
    }

    public function submitters(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['nullable', 'in:all,weekly,monthly'],
            'district' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $period = $validated['period'] ?? 'all';
        $limit = $validated['limit'] ?? 50;

        $rows = $period === 'all' && empty($validated['district']) && empty($validated['category'])
            ? $this->allTimeSubmitters($limit)
            : $this->periodSubmitters($period, $limit, $validated['district'] ?? null, $validated['category'] ?? null);

        return response()->json(['data' => $this->rankRows($rows)]);
    }

    private function allTimeGuessers(int $limit): array
    {
        return User::query()
            ->where('guesses_played_count', '>', 0)
            ->orderByDesc('guesser_score_total')
            ->orderByDesc('correct_guesses_count')
            ->orderByDesc('best_guess_streak')
            ->limit($limit)
            ->get()
            ->map(fn (User $user) => [
                'user_id' => $user->id,
                'username' => $user->username,
                'score' => $user->guesser_score_total,
                'guesses_played' => $user->guesses_played_count,
                'correct_guesses' => $user->correct_guesses_count,
                'accuracy' => $user->guesses_played_count > 0 ? round($user->correct_guesses_count / $user->guesses_played_count, 4) : 0,
                'best_streak' => $user->best_guess_streak,
                'district' => $user->district,
            ])
            ->all();
    }

    private function periodGuessers(string $period, int $limit, ?string $district, ?string $category): array
    {
        $query = Guess::query()
            ->join('users', 'users.id', '=', 'guesses.guesser_id')
            ->join('photos', 'photos.id', '=', 'guesses.photo_id')
            ->join('venues', 'venues.id', '=', 'photos.venue_id')
            ->selectRaw('users.id as user_id, users.username, users.district, SUM(guesses.score) as score, COUNT(*) as guesses_played, SUM(CASE WHEN guesses.is_correct_name THEN 1 ELSE 0 END) as correct_guesses, MAX(users.best_guess_streak) as best_streak')
            ->when($start = $this->periodStart($period), fn ($q) => $q->where('guesses.created_at', '>=', $start))
            ->when($district, fn ($q) => $q->where('venues.district', $district))
            ->when($category, fn ($q) => $q->where('photos.category', $category))
            ->groupBy('users.id', 'users.username', 'users.district')
            ->orderByDesc('score')
            ->orderByDesc('correct_guesses')
            ->orderByDesc('best_streak')
            ->limit($limit)
            ->get();

        return $query->map(fn ($row) => [
            'user_id' => $row->user_id,
            'username' => $row->username,
            'score' => (int) $row->score,
            'guesses_played' => (int) $row->guesses_played,
            'correct_guesses' => (int) $row->correct_guesses,
            'accuracy' => (int) $row->guesses_played > 0 ? round((int) $row->correct_guesses / (int) $row->guesses_played, 4) : 0,
            'best_streak' => (int) $row->best_streak,
            'district' => $row->district,
        ])->all();
    }

    private function allTimeSubmitters(int $limit): array
    {
        return User::query()
            ->where('xp_total', '>', 0)
            ->orderByDesc('xp_total')
            ->orderByDesc('approved_count')
            ->limit($limit)
            ->get()
            ->map(fn (User $user) => [
                'user_id' => $user->id,
                'username' => $user->username,
                'xp_total' => $user->xp_total,
                'approved_count' => $user->approved_count,
                'rejected_count' => $user->rejected_count,
                'trust_tier' => $user->trust_tier,
                'district' => $user->district,
            ])
            ->all();
    }

    private function periodSubmitters(string $period, int $limit, ?string $district, ?string $category): array
    {
        $query = XpEvent::query()
            ->join('users', 'users.id', '=', 'xp_events.user_id')
            ->leftJoin('photos', 'photos.id', '=', 'xp_events.photo_id')
            ->leftJoin('venues', 'venues.id', '=', 'photos.venue_id')
            ->selectRaw('users.id as user_id, users.username, users.district, users.approved_count, users.rejected_count, users.trust_tier, SUM(xp_events.amount) as xp_total')
            ->when($start = $this->periodStart($period), fn ($q) => $q->where('xp_events.created_at', '>=', $start))
            ->when($district, fn ($q) => $q->where('venues.district', $district))
            ->when($category, fn ($q) => $q->where('photos.category', $category))
            ->groupBy('users.id', 'users.username', 'users.district', 'users.approved_count', 'users.rejected_count', 'users.trust_tier')
            ->orderByDesc('xp_total')
            ->orderByDesc('users.approved_count')
            ->limit($limit)
            ->get();

        return $query->map(fn ($row) => [
            'user_id' => $row->user_id,
            'username' => $row->username,
            'xp_total' => (int) $row->xp_total,
            'approved_count' => (int) $row->approved_count,
            'rejected_count' => (int) $row->rejected_count,
            'trust_tier' => $row->trust_tier,
            'district' => $row->district,
        ])->all();
    }

    private function periodStart(string $period): ?Carbon
    {
        return match ($period) {
            'weekly' => now()->subWeek(),
            'monthly' => now()->subMonth(),
            default => null,
        };
    }

    private function rankRows(array $rows): array
    {
        return collect($rows)
            ->values()
            ->map(fn (array $row, int $index) => ['rank' => $index + 1, ...$row])
            ->all();
    }
}

<?php

namespace App\Services\Game;

use App\Models\Photo;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PhotoSelectionService
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function selectForUser(User $user, ?string $category = null, ?string $district = null, int $limit = 1): ?Photo
    {
        $criteria = $this->buildCriteria($user, $category, $district, $limit);

        $photoId = $this->selectWeighted($criteria);

        if ($photoId === null) {
            return null;
        }

        return Photo::find($photoId);
    }

    public function selectManyForUser(User $user, int $count, ?string $category = null, ?string $district = null): Collection
    {
        $criteria = $this->buildCriteria($user, $category, $district, $count);

        $photoIds = DB::table('photos')
            ->select('id')
            ->where('status', 'approved')
            ->when($criteria['excludeOwn'], fn ($q) => $q->where('submitter_id', '!=', $user->id))
            ->when($criteria['excludeSeen'], fn ($q) => $q->whereNotIn('id', $criteria['guessedPhotoIds']))
            ->when($criteria['requireCensoredUrl'], fn ($q) => $q->whereNotNull('censored_url'))
            ->when($criteria['category'] !== null, fn ($q) => $q->where('category', $criteria['category']))
            ->when($criteria['district'] !== null, function ($q) use ($criteria): void {
                $q->whereExists(function ($sub) use ($criteria): void {
                    $sub->select(DB::raw(1))
                        ->from('venues')
                        ->whereColumn('venues.id', 'photos.venue_id')
                        ->where('venues.district', $criteria['district']);
                });
            })
            ->inRandomOrder()
            ->limit($count)
            ->pluck('id');

        return Photo::whereIn('id', $photoIds)->get();
    }

    private function buildCriteria(User $user, ?string $category, ?string $district, int $limit): array
    {
        $excludeSeen = $this->settings->bool('exclude_already_guessed_photos', true);

        $guessedPhotoIds = $excludeSeen
            ? DB::table('guesses')->where('guesser_id', $user->id)->pluck('photo_id')->toArray()
            : [];

        return [
            'user' => $user,
            'category' => $category,
            'district' => $district,
            'limit' => $limit,
            'excludeOwn' => $this->settings->bool('exclude_own_submissions', true),
            'excludeSeen' => $excludeSeen,
            'requireApproved' => $this->settings->bool('require_approved_photos', true),
            'requireCensoredUrl' => $this->settings->bool('require_censored_url', true),
            'underplayedThreshold' => $this->settings->int('underplayed_photo_threshold', 10),
            'freshnessDays' => $this->settings->int('freshness_boost_days', 30),
            'guessedPhotoIds' => $guessedPhotoIds,
        ];
    }

    private function selectWeighted(array $criteria): ?string
    {
        $threshold = $criteria['underplayedThreshold'];
        $freshnessDays = $criteria['freshnessDays'];

        $query = DB::table('photos')
            ->select('id')
            ->where('status', 'approved')
            ->when($criteria['excludeOwn'], fn ($q) => $q->where('submitter_id', '!=', $criteria['user']->id))
            ->when($criteria['excludeSeen'], fn ($q) => $q->whereNotIn('id', $criteria['guessedPhotoIds']))
            ->when($criteria['requireCensoredUrl'], fn ($q) => $q->whereNotNull('censored_url'))
            ->when($criteria['category'] !== null, fn ($q) => $q->where('category', $criteria['category']));

        if ($criteria['district'] !== null) {
            $query->whereExists(function ($sub) use ($criteria) {
                $sub->select(DB::raw(1))
                    ->from('venues')
                    ->whereColumn('venues.id', 'photos.venue_id')
                    ->where('venues.district', $criteria['district']);
            });
        }

        return $query
            ->orderByRaw("
                RANDOM() *
                CASE WHEN total_guesses < {$threshold} THEN 2.0 ELSE 1.0 END *
                CASE
                    WHEN created_at > NOW() - INTERVAL '{$freshnessDays} days'
                    THEN 1.0 + 0.5 * (1 - EXTRACT(EPOCH FROM (NOW() - created_at)) / ({$freshnessDays} * 86400))
                    ELSE 1.0
                END DESC
            ")
            ->value('id');
    }
}

<?php

namespace App\Services\Game;

use App\Models\DailyChallenge;
use App\Models\Photo;
use App\Services\SettingsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DailyChallengeGenerator
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function generateDraft(?\DateTimeInterface $date = null, ?int $generatedBy = null): DailyChallenge
    {
        $date = $date ? Carbon::instance($date) : now();
        $dateString = $date->format('Y-m-d');
        $roundCount = $this->settings->int('daily_round_count', 5);

        return DB::transaction(function () use ($dateString, $roundCount, $generatedBy): DailyChallenge {
            $challenge = DailyChallenge::firstOrCreate(
                ['date' => $dateString],
                [
                    'status' => 'draft',
                    'generated_by' => $generatedBy,
                ]
            );

            $challenge->photos()->delete();
            $this->fillPhotos($challenge, $roundCount);

            return $challenge->fresh('photos');
        });
    }

    public function regeneratePhotos(DailyChallenge $challenge): void
    {
        $roundCount = $this->settings->int('daily_round_count', 5);

        DB::transaction(function () use ($challenge, $roundCount): void {
            $challenge->photos()->delete();
            $this->fillPhotos($challenge, $roundCount);
        });
    }

    public function publish(DailyChallenge $challenge): void
    {
        $challenge->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    private function fillPhotos(DailyChallenge $challenge, int $roundCount): void
    {
        $photoIds = Photo::approved()
            ->whereNotNull('censored_url')
            ->inRandomOrder()
            ->limit($roundCount)
            ->pluck('id')
            ->values();

        $rows = $photoIds->map(fn ($photoId, $index) => [
            'daily_challenge_id' => $challenge->id,
            'photo_id' => $photoId,
            'position' => $index + 1,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if (! empty($rows)) {
            DB::table('daily_challenge_photos')->insert($rows);
        }
    }

    public function getPublishedForDate(\DateTimeInterface $date): ?DailyChallenge
    {
        return DailyChallenge::where('date', $date->format('Y-m-d'))
            ->where('status', 'published')
            ->with(['photos.photo.venue', 'photos.photo.submitter'])
            ->first();
    }
}

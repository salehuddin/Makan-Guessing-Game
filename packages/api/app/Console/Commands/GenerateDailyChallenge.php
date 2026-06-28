<?php

namespace App\Console\Commands;

use App\Services\Game\DailyChallengeGenerator;
use Illuminate\Console\Command;

class GenerateDailyChallenge extends Command
{
    protected $signature = 'guesseat:daily-challenge {--date= : Date in Y-m-d format (defaults to today)} {--publish : Publish the challenge immediately}';

    protected $description = 'Generate and persist the daily challenge photo set';

    public function handle(DailyChallengeGenerator $generator): int
    {
        $date = $this->option('date') ? now()->parse($this->option('date')) : now();

        $challenge = $generator->generateDraft($date);

        if ($challenge->photos()->count() === 0) {
            $this->warn('No approved photos available to build the daily challenge.');

            return self::FAILURE;
        }

        $this->info("Daily challenge for {$challenge->date->format('Y-m-d')} generated with {$challenge->photos()->count()} photos (status: {$challenge->status}).");

        if ($this->option('publish')) {
            $generator->publish($challenge);
            $this->info('Daily challenge published.');
        }

        return self::SUCCESS;
    }
}

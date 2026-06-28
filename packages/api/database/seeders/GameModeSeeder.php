<?php

namespace Database\Seeders;

use App\Models\GameMode;
use Illuminate\Database\Seeder;

class GameModeSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            [
                'slug' => 'classic',
                'name' => 'Classic Guess',
                'description' => 'Photo with 4 multiple-choice options. Infinite rounds with weighted random selection.',
                'enabled' => true,
                'is_builtin' => true,
                'round_count' => null,
                'option_count' => 4,
                'selection_strategy' => 'weighted_random',
            ],
            [
                'slug' => 'daily',
                'name' => 'Daily Challenge',
                'description' => '5 curated photos, same set for all players. Resets at midnight.',
                'enabled' => true,
                'is_builtin' => true,
                'round_count' => 5,
                'option_count' => 4,
                'selection_strategy' => 'curated_daily',
            ],
        ];

        foreach ($modes as $mode) {
            GameMode::updateOrCreate(['slug' => $mode['slug']], $mode);
        }

        $this->command->info('Seeded '.count($modes).' game modes.');
    }
}

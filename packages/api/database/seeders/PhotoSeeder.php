<?php

namespace Database\Seeders;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Seeder;

class PhotoSeeder extends Seeder
{
    public function run(): void
    {
        $curator = User::where('username', 'makan_curator')->first();
        $venues = Venue::all();

        $categories = Photo::CATEGORIES;

        foreach ($venues as $venue) {
            Photo::factory()->approved()->create([
                'venue_id' => $venue->id,
                'submitter_id' => $curator->id,
                'category' => fake()->randomElement($categories),
                'censored_url' => 'censored/demo.webp',
                'thumbnail_url' => 'thumb/demo.webp',
                'original_url' => 'raw/demo.jpg',
                'phash' => fake()->regexify('[0-9a-f]{16}'),
                'total_guesses' => fake()->numberBetween(0, 20),
                'correct_guesses' => fake()->numberBetween(0, 10),
            ]);
        }

        $this->command->info('Seeded '.$venues->count().' approved photos.');
    }
}

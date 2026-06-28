<?php

namespace Database\Factories;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Photo>
 */
class PhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'venue_id' => Venue::factory(),
            'submitter_id' => User::factory(),
            'category' => fake()->randomElement(Photo::CATEGORIES),
            'secondary_tags' => [],
            'status' => 'pending',
            'client_censored' => false,
            'original_url' => 'raw/fake.jpg',
            'quality_score' => 0.5,
            'total_guesses' => 0,
            'total_guess_time_ms' => 0,
            'avg_guess_time_ms' => null,
            'avg_rating' => 0,
            'correct_guesses' => 0,
            'engagement_xp_awarded' => 0,
            'needs_human_review' => false,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'censored_url' => 'censored/fake.webp',
            'thumbnail_url' => 'thumb/fake.webp',
            'phash' => 'abcdef0123456789',
        ]);
    }
}

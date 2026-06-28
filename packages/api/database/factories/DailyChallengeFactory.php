<?php

namespace Database\Factories;

use App\Models\DailyChallenge;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DailyChallenge>
 */
class DailyChallengeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'date' => fake()->date(),
            'title' => null,
            'status' => 'draft',
            'generated_by' => User::factory(),
        ];
    }
}

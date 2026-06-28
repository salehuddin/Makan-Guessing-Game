<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'phone' => fake()->unique()->numerify('+601########'),
            'phone_verified_at' => now(),
            'email' => fake()->optional()->safeEmail(),
            'email_verified_at' => null,
            'password' => static::$password ??= Hash::make('password'),
            'trust_tier' => 'new',
            'xp_total' => 0,
            'guesser_score_total' => 0,
            'guesses_played_count' => 0,
            'correct_guesses_count' => 0,
            'submitter_streak' => 0,
            'guesser_streak' => 0,
            'best_guess_streak' => 0,
            'approved_count' => 0,
            'rejected_count' => 0,
            'district' => fake()->optional()->city(),
            'profile_bio' => null,
            'avatar_url' => null,
            'cover_url' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'phone_verified_at' => null,
        ]);
    }
}

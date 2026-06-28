<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

/**
 * @extends Factory<Venue>
 */
class VenueFactory extends Factory
{
    public function definition(): array
    {
        $klLat = fake()->latitude(3.0, 3.3);
        $klLng = fake()->longitude(101.5, 101.9);

        return [
            'name' => fake()->company().' Restaurant',
            'address' => fake()->streetAddress(),
            'district' => fake()->randomElement(['KLCC', 'Bukit Bintang', 'Bangsar', 'Petaling Jaya', 'Subang', 'Cheras']),
            'location' => DB::raw("ST_SetSRID(ST_MakePoint({$klLng}, {$klLat}), 4326)::geography"),
            'venue_type' => fake()->randomElement(['restaurant', 'mamak', 'kopitiam', 'hawker_stall', 'warung', 'cafe', 'food_court']),
            'cuisine_tags' => fake()->randomElements(['malay', 'chinese', 'indian', 'mamak', 'nyonya', 'thai', 'japanese', 'korean'], 2),
            'price_range' => fake()->numberBetween(1, 3),
            'halal_status' => fake()->randomElement(['halal', 'non_halal', 'muslim_friendly', 'unknown']),
            'first_submitted_by' => User::factory(),
        ];
    }
}

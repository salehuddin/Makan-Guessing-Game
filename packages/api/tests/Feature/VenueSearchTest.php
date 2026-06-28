<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VenueSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_results(): void
    {
        $user = User::factory()->create();

        Venue::factory()->create(['name' => 'Restoran Maju Jaya']);
        Venue::factory()->create(['name' => 'Kedai Makanan Best']);

        $response = $this->actingAs($user)->getJson('/api/venues/search?q=Maju');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Restoran Maju Jaya');
    }

    public function test_search_requires_authentication(): void
    {
        $response = $this->getJson('/api/venues/search?q=test');

        $response->assertUnauthorized();
    }

    public function test_search_validates_minimum_query_length(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/venues/search?q=a');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['q']);
    }

    public function test_show_returns_venue_details(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/venues/{$venue->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $venue->id);
        $response->assertJsonPath('data.name', $venue->name);
    }

    public function test_suggest_creates_new_venue(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/venues/suggest', [
            'name' => 'Warung Pak Mat',
            'district' => 'Shah Alam',
            'lat' => 3.07,
            'lng' => 101.55,
            'venue_type' => 'warung',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('venue.name', 'Warung Pak Mat');

        $this->assertDatabaseHas('venues', [
            'name' => 'Warung Pak Mat',
            'district' => 'Shah Alam',
            'first_submitted_by' => $user->id,
        ]);
    }

    public function test_suggest_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/venues/suggest', [
            'name' => 'Test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['district', 'lat', 'lng']);
    }
}

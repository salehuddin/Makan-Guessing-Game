<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Services\SettingsService;
use Database\Seeders\GameModeSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminDashboardUsersVenuesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingsSeeder::class);
        $this->seed(GameModeSeeder::class);

        app(SettingsService::class)->flushCache();
    }

    public function test_non_admin_cannot_access_dashboard(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_admin_can_view_dashboard_stats(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard');

        $response->assertOk();
        $response->assertJsonStructure(['data' => [
            'pending_moderation', 'quarantined', 'playable_photos',
            'total_venues', 'venues_with_photos', 'never_guessed',
            'challenge_today', 'modes', 'category_coverage',
            'categories_covered', 'categories_total',
        ]]);
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/users');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'meta']);
        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_admin_can_search_users(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'username' => 'searchadmin']);
        User::factory()->create(['username' => 'searchtarget_unique']);

        $response = $this->actingAs($admin)->getJson('/api/admin/users?search=searchtarget_unique');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_admin_can_view_user_detail_with_activity(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $target = User::factory()->create(['username' => 'targetuser']);
        $venue = Venue::factory()->create(['district' => 'Bangsar']);

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $target->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guess = $target->guesses()->create([
            'photo_id' => $photo->id,
            'guesser_id' => $target->id,
            'guessed_venue_id' => $venue->id,
            'is_correct_name' => true,
            'time_ms' => 2000,
            'score' => 80,
            'game_mode_slug' => 'classic',
            'actual_pin' => DB::raw('ST_SetSRID(ST_MakePoint(101.67, 3.13), 4326)::geography'),
        ]);

        $target->xpEvents()->create([
            'type' => 'guess_correct',
            'amount' => 80,
            'guess_id' => $guess->id,
            'photo_id' => $photo->id,
        ]);

        $target->socialAccounts()->create([
            'provider' => 'google',
            'provider_id' => 'google-123',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$target->id}");

        $response->assertOk();
        $response->assertJsonStructure(['data' => [
            'id', 'username', 'photos', 'guesses', 'xp_events', 'social_accounts',
        ]]);

        $this->assertCount(1, $response->json('data.photos'));
        $this->assertCount(1, $response->json('data.guesses'));
        $this->assertCount(1, $response->json('data.xp_events'));
        $this->assertCount(1, $response->json('data.social_accounts'));
    }

    public function test_admin_can_update_user_trust_tier(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false, 'trust_tier' => 'new']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'trust_tier' => 'trusted',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.trust_tier', 'trusted');
    }

    public function test_admin_can_toggle_admin_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'is_admin' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_admin', true);
    }

    public function test_invalid_trust_tier_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'trust_tier' => 'superuser',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['trust_tier']);
    }

    public function test_non_admin_cannot_list_venues(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/venues')->assertForbidden();
    }

    public function test_admin_can_list_venues(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Venue::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/venues');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_create_venue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->postJson('/api/admin/venues', [
            'name' => 'Test Mamak',
            'lat' => 3.139,
            'lng' => 101.6869,
            'district' => 'KLCC',
            'venue_type' => 'mamak',
            'halal_status' => 'muslim_friendly',
            'price_range' => 2,
            'cuisine_tags' => ['malay', 'indian'],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Test Mamak');
    }

    public function test_venue_creation_validates_required_fields(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->postJson('/api/admin/venues', [
            'name' => 'Missing Fields',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['lat', 'lng', 'district', 'venue_type', 'halal_status', 'price_range']);
    }

    public function test_admin_can_update_venue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/venues/{$venue->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'New Name');
    }

    public function test_admin_can_delete_venue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/venues/{$venue->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('venues', ['id' => $venue->id]);
    }
}

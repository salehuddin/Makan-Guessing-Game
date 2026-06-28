<?php

namespace Tests\Feature;

use App\Models\DailyChallenge;
use App\Models\DailyChallengePhoto;
use App\Models\GameMode;
use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Services\SettingsService;
use Database\Seeders\GameModeSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPhotosGameModesDailyChallengesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingsSeeder::class);
        $this->seed(GameModeSeeder::class);

        app(SettingsService::class)->flushCache();
    }

    public function test_non_admin_cannot_list_photos(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/photos')->assertForbidden();
    }

    public function test_admin_can_list_photos(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        Photo::factory()->count(3)->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/photos');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'meta']);
        $this->assertGreaterThanOrEqual(3, count($response->json('data')));
    }

    public function test_admin_can_filter_photos_by_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create(['name' => 'FilterTestVenue']);
        $submitter = User::factory()->create(['username' => 'filtersubmitter']);

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
        ]);
        Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/photos?status=approved');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $photo->id, 'status' => 'approved']);
    }

    public function test_admin_can_view_photo_detail(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/photos/{$photo->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $photo->id);
    }

    public function test_admin_can_update_photo_category(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'category' => 'general',
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/photos/{$photo->id}", [
            'category' => 'signature_dish',
        ]);

        $response->assertOk();
    }

    public function test_invalid_photo_category_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/photos/{$photo->id}", [
            'category' => 'invalid_category',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_quarantine_photo(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/quarantine");

        $response->assertOk();
        $photo->refresh();
        $this->assertEquals('quarantined', $photo->status);
        $this->assertTrue($photo->needs_human_review);
    }

    public function test_non_admin_cannot_list_game_modes(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/game-modes')->assertForbidden();
    }

    public function test_admin_can_list_game_modes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/game-modes');

        $response->assertOk();
        $response->assertJsonStructure(['data' => [['id', 'slug', 'name', 'enabled', 'is_builtin', 'is_protected', 'selection_strategy']]]);
    }

    public function test_admin_can_update_game_mode_option_count(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $mode = GameMode::where('slug', 'classic')->first();

        $response = $this->actingAs($admin)->patchJson("/api/admin/game-modes/{$mode->id}", [
            'option_count' => 6,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.option_count', 6);
    }

    public function test_invalid_option_count_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $mode = GameMode::where('slug', 'classic')->first();

        $response = $this->actingAs($admin)->patchJson("/api/admin/game-modes/{$mode->id}", [
            'option_count' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_protected_game_mode_strategy_cannot_be_changed(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $mode = GameMode::where('slug', 'classic')->first();
        $originalStrategy = $mode->selection_strategy;

        $response = $this->actingAs($admin)->patchJson("/api/admin/game-modes/{$mode->id}", [
            'selection_strategy' => 'fixed_sequence',
        ]);

        $response->assertOk();
        $mode->refresh();
        $this->assertEquals($originalStrategy, $mode->selection_strategy);
    }

    public function test_non_admin_cannot_list_daily_challenges(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/daily-challenges')->assertForbidden();
    }

    public function test_admin_can_list_daily_challenges(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        DailyChallenge::factory()->create(['date' => '2026-01-01']);
        DailyChallenge::factory()->create(['date' => '2026-01-02']);

        $response = $this->actingAs($admin)->getJson('/api/admin/daily-challenges');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_view_daily_challenge_detail_with_photos(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $challenge = DailyChallenge::factory()->create(['date' => '2026-01-15', 'status' => 'draft']);
        $venue = Venue::factory()->create();
        $submitter = User::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'censored_url' => 'censored/test.webp',
        ]);

        DailyChallengePhoto::create([
            'daily_challenge_id' => $challenge->id,
            'photo_id' => $photo->id,
            'position' => 1,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/daily-challenges/{$challenge->id}");

        $response->assertOk();
        $response->assertJsonStructure(['data' => ['id', 'date', 'title', 'status', 'can_be_edited', 'photos']]);
        $this->assertCount(1, $response->json('data.photos'));
        $this->assertEquals(1, $response->json('data.photos.0.position'));
        $this->assertEquals($venue->name, $response->json('data.photos.0.photo.venue.name'));
    }

    public function test_admin_can_update_daily_challenge_title(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $challenge = DailyChallenge::factory()->create(['date' => '2026-01-20', 'status' => 'draft', 'title' => null]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/daily-challenges/{$challenge->id}", [
            'title' => 'Malaysian Food Day',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Malaysian Food Day');
    }

    public function test_admin_can_delete_daily_challenge(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $challenge = DailyChallenge::factory()->create(['date' => '2026-01-25']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/daily-challenges/{$challenge->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('daily_challenges', ['id' => $challenge->id]);
    }
}

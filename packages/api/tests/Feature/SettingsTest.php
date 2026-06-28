<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Services\SettingsService;
use Database\Seeders\GameModeSeeder;
use Database\Seeders\IntegrationSettingsSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingsSeeder::class);
        $this->seed(IntegrationSettingsSeeder::class);
        $this->seed(GameModeSeeder::class);

        app(SettingsService::class)->flushCache();
    }

    public function test_settings_service_reads_seeded_defaults(): void
    {
        $service = app(SettingsService::class);

        $this->assertTrue($service->bool('classic_guess_enabled'));
        $this->assertTrue($service->bool('daily_challenge_enabled'));
        $this->assertSame(4, $service->int('classic_option_count'));
        $this->assertSame(5, $service->int('daily_round_count'));
        $this->assertFalse($service->bool('return_correct_answer_before_guess'));
    }

    public function test_settings_cache_flushes_after_update(): void
    {
        $service = app(SettingsService::class);

        $this->assertTrue($service->bool('classic_guess_enabled'));

        $service->set('classic_guess_enabled', false);
        $service->flushCache();

        $this->assertFalse($service->bool('classic_guess_enabled'));

        $service->set('classic_guess_enabled', true);
        $service->flushCache();
    }

    public function test_classic_play_returns_403_when_disabled(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create(['district' => 'Bangsar']);
        Venue::factory()->count(3)->create(['district' => 'Bangsar']);

        Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $service = app(SettingsService::class);
        $service->set('classic_guess_enabled', false);
        $service->flushCache();

        $response = $this->actingAs($user)->postJson('/api/play/classic');

        $response->assertStatus(403);

        $service->set('classic_guess_enabled', true);
        $service->flushCache();
    }

    public function test_guess_submit_returns_403_when_classic_disabled(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $service = app(SettingsService::class);
        $service->set('classic_guess_enabled', false);
        $service->flushCache();

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertStatus(403);

        $service->set('classic_guess_enabled', true);
        $service->flushCache();
    }

    public function test_photo_upload_returns_403_when_disabled(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $service = app(SettingsService::class);
        $service->set('photo_upload_enabled', false);
        $service->flushCache();

        Storage::fake('local');

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('photo.jpg', 800, 600),
            'category' => 'general',
            'venue_id' => $venue->id,
            'client_censored' => false,
        ]);

        $response->assertStatus(403);

        $service->set('photo_upload_enabled', true);
        $service->flushCache();
    }

    public function test_venue_suggestion_returns_403_when_disabled(): void
    {
        $user = User::factory()->create();

        $service = app(SettingsService::class);
        $service->set('venue_suggestions_enabled', false);
        $service->flushCache();

        $response = $this->actingAs($user)->postJson('/api/venues/suggest', [
            'name' => 'Test Restaurant',
            'district' => 'Bangsar',
            'lat' => 3.13,
            'lng' => 101.67,
        ]);

        $response->assertStatus(403);

        $service->set('venue_suggestions_enabled', true);
        $service->flushCache();
    }

    public function test_classic_exposes_answer_when_setting_enabled(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create(['district' => 'Bangsar']);
        Venue::factory()->count(3)->create(['district' => 'Bangsar']);

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $service = app(SettingsService::class);
        $service->set('return_correct_answer_before_guess', true);
        $service->flushCache();

        $response = $this->actingAs($user)->postJson('/api/play/classic');

        $response->assertOk();
        $response->assertJsonPath('correct_venue_id', $photo->venue_id);

        $service->set('return_correct_answer_before_guess', false);
        $service->flushCache();
    }

    public function test_guess_stores_game_mode_slug(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('guesses', [
            'photo_id' => $photo->id,
            'guesser_id' => $user->id,
            'game_mode_slug' => 'classic',
        ]);
    }

    public function test_game_modes_seeded(): void
    {
        $this->assertDatabaseHas('game_modes', ['slug' => 'classic', 'is_builtin' => true]);
        $this->assertDatabaseHas('game_modes', ['slug' => 'daily', 'is_builtin' => true]);
    }

    public function test_integration_settings_seeded(): void
    {
        $this->assertDatabaseHas('integration_settings', ['key' => 'twilio']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'google_auth']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'facebook_auth']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'apple_auth']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'tiktok_auth']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'r2']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'redis']);
    }
}

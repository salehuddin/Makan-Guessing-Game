<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Services\SettingsService;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SettingsSeeder::class);
        app(SettingsService::class)->flushCache();
    }

    public function test_public_settings_endpoint_returns_ad_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertOk();
        $response->assertJsonStructure([
            'settings' => [
                'ads_enabled_mobile',
                'ads_enabled_web',
                'ads_provider_mobile',
                'ads_provider_web',
                'ads_placement_home_banner',
                'ads_placement_play_bottom',
                'ads_placement_interstitial_interval',
                'ads_rewarded_streak_freeze',
                'ads_rewarded_double_xp',
                'ads_admob_banner_unit_id',
                'ads_adsense_client_id',
            ],
        ]);
    }

    public function test_rewarded_double_xp_claims_successfully_for_correct_guess(): void
    {
        $user = User::factory()->create(['guesser_score_total' => 0]);
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $guessResponse->assertOk();
        $guessId = $guessResponse->json('guess_id');
        $originalScore = $guessResponse->json('score');

        $this->assertGreaterThan(0, $originalScore);

        $response = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $response->assertOk();
        $response->assertJsonPath('reward_type', 'double_xp');
        $response->assertJsonPath('reward_amount', $originalScore);

        $user->refresh();
        $this->assertSame($originalScore * 2, $user->guesser_score_total);

        $this->assertDatabaseHas('ad_views', [
            'user_id' => $user->id,
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'ad_type' => 'rewarded',
        ]);
    }

    public function test_rewarded_streak_freeze_restores_streak_after_wrong_guess(): void
    {
        $user = User::factory()->create(['guesser_streak' => 0]);
        $venue = Venue::factory()->create();
        $wrongVenue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $wrongVenue->id,
            'time_ms' => 3000,
        ]);

        $guessResponse->assertOk();
        $guessResponse->assertJsonPath('is_correct_name', false);
        $guessId = $guessResponse->json('guess_id');

        $response = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'streak_freeze',
            'platform' => 'mobile',
        ]);

        $response->assertOk();
        $response->assertJsonPath('reward_type', 'streak_freeze');

        $this->assertDatabaseHas('ad_views', [
            'user_id' => $user->id,
            'guess_id' => $guessId,
            'reward_type' => 'streak_freeze',
        ]);
    }

    public function test_double_claim_is_prevented(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $guessId = $guessResponse->json('guess_id');

        $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $secondResponse = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $secondResponse->assertStatus(422);
        $secondResponse->assertJsonPath('message', 'Reward already claimed for this guess.');
    }

    public function test_double_xp_rejected_for_wrong_guess(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();
        $wrongVenue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $wrongVenue->id,
            'time_ms' => 3000,
        ]);

        $guessId = $guessResponse->json('guess_id');

        $response = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $response->assertStatus(422);
    }

    public function test_streak_freeze_rejected_for_correct_guess(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $guessId = $guessResponse->json('guess_id');

        $response = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'streak_freeze',
            'platform' => 'web',
        ]);

        $response->assertStatus(422);
    }

    public function test_rewarded_callback_returns_403_when_feature_disabled(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $guessResponse = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $guessId = $guessResponse->json('guess_id');

        $service = app(SettingsService::class);
        $service->set('ads_rewarded_double_xp', false);
        $service->flushCache();

        $response = $this->actingAs($user)->postJson('/api/ads/rewarded/callback', [
            'guess_id' => $guessId,
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $response->assertStatus(403);

        $service->set('ads_rewarded_double_xp', true);
        $service->flushCache();
    }

    public function test_rewarded_callback_requires_authentication(): void
    {
        $response = $this->postJson('/api/ads/rewarded/callback', [
            'guess_id' => 'fake-id',
            'reward_type' => 'double_xp',
            'platform' => 'web',
        ]);

        $response->assertUnauthorized();
    }
}

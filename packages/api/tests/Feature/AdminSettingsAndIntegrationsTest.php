<?php

namespace Tests\Feature;

use App\Models\IntegrationSetting;
use App\Models\User;
use App\Services\SettingsService;
use Database\Seeders\IntegrationSettingsSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsAndIntegrationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingsSeeder::class);
        $this->seed(IntegrationSettingsSeeder::class);

        app(SettingsService::class)->flushCache();
    }

    public function test_non_admin_cannot_view_settings(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/settings')->assertForbidden();
    }

    public function test_admin_can_list_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/settings');

        $response->assertOk();
        $response->assertJsonStructure(['data' => [['id', 'key', 'value', 'type', 'group', 'label', 'description', 'is_public', 'enum_values', 'integer_range']]]);
    }

    public function test_admin_can_update_valid_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->patchJson('/api/admin/settings', [
            'settings' => [
                'classic_option_count' => 6,
                'ads_enabled_web' => true,
                'default_language' => 'ms',
            ],
        ]);

        $response->assertOk();

        app(SettingsService::class)->flushCache();
        $service = app(SettingsService::class);

        $this->assertSame(6, $service->int('classic_option_count'));
        $this->assertTrue($service->bool('ads_enabled_web'));
        $this->assertSame('ms', $service->string('default_language'));
    }

    public function test_unknown_setting_keys_are_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->patchJson('/api/admin/settings', [
            'settings' => [
                'nonexistent_key' => 'foo',
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings']);
    }

    public function test_invalid_enum_value_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->patchJson('/api/admin/settings', [
            'settings' => [
                'default_language' => 'fr',
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings.default_language']);
    }

    public function test_integer_out_of_range_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->patchJson('/api/admin/settings', [
            'settings' => [
                'classic_option_count' => 100,
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings.classic_option_count']);
    }

    public function test_non_admin_cannot_view_integrations(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/integrations')->assertForbidden();
    }

    public function test_admin_can_list_integrations(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->getJson('/api/admin/integrations');

        $response->assertOk();
        $response->assertJsonStructure(['data' => [['id', 'key', 'label', 'description', 'enabled', 'mode', 'settings', 'last_status', 'last_error', 'last_checked_at', 'available_modes']]]);
    }

    public function test_admin_can_update_integration_enabled_and_mode(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $integration = IntegrationSetting::where('key', 'twilio')->first();

        $response = $this->actingAs($admin)->patchJson("/api/admin/integrations/{$integration->id}", [
            'enabled' => true,
            'mode' => 'staging',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.enabled', true);
        $response->assertJsonPath('data.mode', 'staging');
    }

    public function test_invalid_integration_mode_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $integration = IntegrationSetting::where('key', 'twilio')->first();

        $response = $this->actingAs($admin)->patchJson("/api/admin/integrations/{$integration->id}", [
            'mode' => 'live',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['mode']);
    }

    public function test_admin_can_test_integration_connection_and_records_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $integration = IntegrationSetting::where('key', 'redis')->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/integrations/{$integration->id}/test");

        $response->assertOk();
        $response->assertJsonStructure(['message', 'data' => ['last_status', 'last_checked_at']]);

        $integration->refresh();

        $this->assertNotNull($integration->last_checked_at);
        $this->assertNotNull($integration->last_status);
    }

    public function test_ads_integrations_are_seeded(): void
    {
        $this->assertDatabaseHas('integration_settings', ['key' => 'google_admob']);
        $this->assertDatabaseHas('integration_settings', ['key' => 'google_adsense']);
    }

    public function test_admob_health_check_passes_with_seeded_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $integration = IntegrationSetting::where('key', 'google_admob')->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/integrations/{$integration->id}/test");

        $response->assertOk();
        $response->assertJsonPath('data.last_status', 'ok');
    }

    public function test_adsense_health_check_passes_with_seeded_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $integration = IntegrationSetting::where('key', 'google_adsense')->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/integrations/{$integration->id}/test");

        $response->assertOk();
        $response->assertJsonPath('data.last_status', 'ok');
    }
}

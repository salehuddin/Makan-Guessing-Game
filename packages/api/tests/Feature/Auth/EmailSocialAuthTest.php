<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\IntegrationService;
use Database\Seeders\IntegrationSettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailSocialAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(IntegrationSettingsSeeder::class);
        app(IntegrationService::class)->flushCache();
    }

    public function test_user_can_register_with_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'username' => 'emailuser',
            'email' => 'email@example.test',
            'password' => 'password123',
            'device_name' => 'web-browser',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['token', 'user']);
        $response->assertJsonPath('user.email', 'email@example.test');

        $this->assertDatabaseHas('users', [
            'username' => 'emailuser',
            'email' => 'email@example.test',
            'phone' => null,
        ]);
    }

    public function test_user_can_login_with_email_and_password(): void
    {
        User::factory()->create([
            'email' => 'login@example.test',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.test',
            'password' => 'password123',
            'device_name' => 'mobile-app',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['token', 'user']);
    }

    public function test_local_mock_social_login_creates_user_and_account(): void
    {
        app(IntegrationService::class)->setEnabledForTesting('google_auth', true);

        $response = $this->postJson('/api/auth/social', [
            'provider' => 'google',
            'token' => 'mock:social@example.test',
            'device_name' => 'web-browser',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.email', 'social@example.test');

        $this->assertDatabaseHas('social_accounts', [
            'provider' => 'google',
            'provider_id' => 'mock-google-social@example.test',
        ]);
    }

    public function test_disabled_social_provider_rejects_login(): void
    {
        $response = $this->postJson('/api/auth/social', [
            'provider' => 'google',
            'token' => 'mock:social@example.test',
            'device_name' => 'web-browser',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Google login is disabled.');
    }
}

<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OtpAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_can_be_sent(): void
    {
        $response = $this->postJson('/api/auth/otp/send', [
            'phone' => '+60123456789',
        ]);

        $response->assertOk();
        $response->assertJson(['message' => 'OTP sent']);
    }

    public function test_otp_send_validates_malaysian_phone_format(): void
    {
        $response = $this->postJson('/api/auth/otp/send', [
            'phone' => '+1234567890',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['phone']);
    }

    public function test_new_user_can_verify_otp_and_receive_token(): void
    {
        $this->postJson('/api/auth/otp/send', [
            'phone' => '+60123456789',
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'phone' => '+60123456789',
            'code' => '123456',
            'device_name' => 'iPhone 17',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', [
            'phone' => '+60123456789',
        ]);

        $user = User::where('phone', '+60123456789')->first();
        $this->assertNotNull($user->phone_verified_at);

        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'iPhone 17',
        ]);
    }

    public function test_existing_user_can_verify_otp(): void
    {
        User::factory()->create([
            'phone' => '+60123456789',
            'username' => 'testuser',
        ]);

        $this->postJson('/api/auth/otp/send', [
            'phone' => '+60123456789',
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'phone' => '+60123456789',
            'code' => '123456',
            'device_name' => 'Android',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.username', 'testuser');
    }

    public function test_wrong_otp_code_returns_422(): void
    {
        $this->postJson('/api/auth/otp/send', [
            'phone' => '+60123456789',
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'phone' => '+60123456789',
            'code' => '000000',
            'device_name' => 'iPhone 17',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_access_profile(): void
    {
        $user = User::factory()->create();

        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user');

        $response->assertOk();
        $response->assertJsonPath('user.id', $user->id);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create(['username' => 'oldname']);

        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/user', [
                'username' => 'foodiehunter88',
                'district' => 'Kuala Lumpur, MY',
                'profile_bio' => 'Obsessed with finding hidden gems',
                'avatar_url' => 'https://example.com/avatar.jpg',
                'cover_url' => 'https://example.com/cover.jpg',
            ]);

        $response->assertOk();
        $response->assertJsonPath('user.username', 'foodiehunter88');
        $response->assertJsonPath('user.district', 'Kuala Lumpur, MY');
        $response->assertJsonPath('user.profile_bio', 'Obsessed with finding hidden gems');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'foodiehunter88',
        ]);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $response->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_request_to_protected_route_returns_401(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertUnauthorized();
    }
}

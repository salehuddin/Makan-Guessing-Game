<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmitterPhoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_phone_user_cannot_suggest_venue(): void
    {
        $user = User::factory()->create([
            'phone' => null,
            'phone_verified_at' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/venues/suggest', [
            'name' => 'Nasi Lemak Place',
            'district' => 'Petaling Jaya',
            'lat' => 3.1,
            'lng' => 101.6,
        ]);

        $response->assertForbidden();
        $response->assertJsonPath('code', 'PHONE_REQUIRED');
    }

    public function test_user_can_verify_profile_phone(): void
    {
        $user = User::factory()->create([
            'phone' => null,
            'phone_verified_at' => null,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/user/phone/send-otp', [
            'phone' => '+60123456789',
        ])->assertOk();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/user/phone/verify-otp', [
            'phone' => '+60123456789',
            'code' => '123456',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.phone', '+60123456789');

        $this->assertNotNull($user->refresh()->phone_verified_at);
    }
}

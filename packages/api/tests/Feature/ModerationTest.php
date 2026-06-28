<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Models\XpEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_pending_photos(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $venue = Venue::factory()->create();

        Photo::factory()->create([
            'venue_id' => $venue->id,
            'status' => 'quarantined',
        ]);

        Photo::factory()->create([
            'venue_id' => $venue->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/photos/pending');

        $response->assertOk();
        $response->assertJsonStructure(['data', 'meta']);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_non_admin_cannot_access_moderation(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user)->getJson('/api/admin/photos/pending');

        $response->assertForbidden();
    }

    public function test_admin_can_approve_photo(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitter = User::factory()->create(['approved_count' => 0, 'xp_total' => 0]);
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'status' => 'quarantined',
            'censored_url' => null,
            'original_url' => 'raw/test.jpg',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/approve");

        $response->assertOk();
        $response->assertJsonPath('photo.status', 'approved');

        $this->assertDatabaseHas('photos', [
            'id' => $photo->id,
            'status' => 'approved',
        ]);

        $submitter->refresh();
        $this->assertGreaterThan(0, $submitter->xp_total);
        $this->assertSame(1, $submitter->approved_count);
        $this->assertSame(1, $submitter->submitter_streak);

        $this->assertDatabaseHas('xp_events', [
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'type' => 'photo_approved',
            'amount' => $submitter->xp_total,
        ]);
    }

    public function test_admin_can_reject_photo(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitter = User::factory()->create(['submitter_streak' => 3]);
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'status' => 'quarantined',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/reject", [
            'reason' => 'Photo is blurry',
        ]);

        $response->assertOk();
        $response->assertJsonPath('photo.status', 'rejected');

        $submitter->refresh();
        $this->assertSame(0, $submitter->submitter_streak);
        $this->assertSame(1, $submitter->rejected_count);
    }

    public function test_approve_already_approved_returns_422(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $photo = Photo::factory()->approved()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/approve");

        $response->assertStatus(422);
    }

    public function test_pioneer_bonus_awarded_for_first_photo_of_venue(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitter = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'status' => 'quarantined',
        ]);

        $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/approve");

        $submitter->refresh();

        $base = 50;
        $pioneer = 200;
        $categoryPioneer = 100;
        $coverageGap = 100;
        $categoryGap = 50;
        $expectedMin = $base + $pioneer + $categoryPioneer + $coverageGap + $categoryGap;

        $this->assertGreaterThanOrEqual($expectedMin, $submitter->xp_total);
    }

    public function test_approval_awards_fresh_angle_bonus_when_phash_is_unique(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitter = User::factory()->create(['xp_total' => 0]);
        $venue = Venue::factory()->create();

        Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'category' => 'general',
            'phash' => '0000000000000000',
        ]);

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'category' => 'signature_dish',
            'status' => 'quarantined',
            'phash' => 'ffffffffffffffff',
        ]);

        $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/approve");

        $this->assertDatabaseHas('xp_events', [
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'type' => 'photo_approved',
        ]);

        $event = XpEvent::where('photo_id', $photo->id)->firstOrFail();
        $this->assertSame(30, $event->breakdown['fresh_angle_bonus']);
    }

    public function test_trust_tier_upgrades_to_verified_after_5_approvals(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitter = User::factory()->create(['trust_tier' => 'new']);
        $venue = Venue::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $photo = Photo::factory()->create([
                'venue_id' => $venue->id,
                'submitter_id' => $submitter->id,
                'status' => 'quarantined',
            ]);

            $this->actingAs($admin)->postJson("/api/admin/photos/{$photo->id}/approve");
        }

        $submitter->refresh();
        $this->assertSame('verified', $submitter->trust_tier);
        $this->assertSame(5, $submitter->approved_count);
    }
}

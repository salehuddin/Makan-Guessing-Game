<?php

namespace Tests\Feature;

use App\Jobs\ProcessPhotoJob;
use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_upload_photo_with_existing_venue(): void
    {
        Storage::fake('local');
        Queue::fake();

        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('test.jpg', 800, 600),
            'category' => 'exterior',
            'venue_id' => $venue->id,
            'client_censored' => true,
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure([
            'message',
            'photo' => ['id', 'venue_id', 'category', 'status'],
        ]);

        $this->assertDatabaseHas('photos', [
            'venue_id' => $venue->id,
            'submitter_id' => $user->id,
            'category' => 'exterior',
            'status' => 'pending',
        ]);

        $photo = Photo::first();
        Storage::disk('local')->assertExists("raw/{$photo->id}.jpg");

        Queue::assertPushed(ProcessPhotoJob::class);
    }

    public function test_upload_requires_authentication(): void
    {
        $venue = Venue::factory()->create();

        $response = $this->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('test.jpg'),
            'category' => 'exterior',
            'venue_id' => $venue->id,
        ]);

        $response->assertUnauthorized();
    }

    public function test_upload_validates_category(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('test.jpg'),
            'category' => 'invalid_category',
            'venue_id' => $venue->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['category']);
    }

    public function test_upload_validates_photo_is_image(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->create('document.pdf', 100),
            'category' => 'exterior',
            'venue_id' => $venue->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['photo']);
    }

    public function test_upload_requires_venue_id_or_venue_data(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('test.jpg'),
            'category' => 'exterior',
        ]);

        $response->assertStatus(422);
    }

    public function test_upload_with_new_venue_suggestion(): void
    {
        Storage::fake('local');
        Queue::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/photos', [
            'photo' => UploadedFile::fake()->image('test.jpg', 800, 600),
            'category' => 'signature_dish',
            'venue' => [
                'name' => 'Restoran Test',
                'district' => 'Bangsar',
                'lat' => 3.13,
                'lng' => 101.68,
            ],
        ]);

        $response->assertStatus(202);

        $this->assertDatabaseHas('venues', [
            'name' => 'Restoran Test',
            'district' => 'Bangsar',
            'first_submitted_by' => $user->id,
        ]);
    }

    public function test_user_can_list_their_photos(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        Photo::factory()->count(3)->create([
            'submitter_id' => $user->id,
            'venue_id' => $venue->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/photos');

        $response->assertOk();
        $response->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_user_can_view_single_photo(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'submitter_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/photos/{$photo->id}");

        $response->assertOk();
        $response->assertJsonPath('photo.id', $photo->id);
    }
}

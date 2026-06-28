<?php

namespace Tests\Feature;

use App\Models\DailyChallengePhoto;
use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Services\Game\DailyChallengeGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_challenge_returns_published_photos(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        Photo::factory()->approved()->count(5)->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $generator = app(DailyChallengeGenerator::class);
        $challenge = $generator->generateDraft(now());
        $generator->publish($challenge);

        $response = $this->actingAs($user)->getJson('/api/daily-challenge');

        $response->assertOk();
        $response->assertJsonStructure(['date', 'challenge', 'total_photos']);
        $this->assertSame(5, $response->json('total_photos'));
        $this->assertCount(5, $response->json('challenge'));
    }

    public function test_daily_challenge_returns_404_when_none_published(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        Photo::factory()->approved()->count(5)->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $generator = app(DailyChallengeGenerator::class);
        $generator->generateDraft(now());

        $response = $this->actingAs($user)->getJson('/api/daily-challenge');

        $response->assertStatus(404);
    }

    public function test_daily_challenge_requires_authentication(): void
    {
        $response = $this->getJson('/api/daily-challenge');

        $response->assertUnauthorized();
    }

    public function test_daily_challenge_guess_works(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $generator = app(DailyChallengeGenerator::class);
        $challenge = $generator->generateDraft(now());
        $generator->publish($challenge);

        $response = $this->actingAs($user)->postJson('/api/daily-challenge/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertOk();
        $response->assertJsonPath('is_correct_name', true);

        $this->assertDatabaseHas('guesses', [
            'photo_id' => $photo->id,
            'guesser_id' => $user->id,
            'game_mode_slug' => 'daily',
            'daily_challenge_id' => $challenge->id,
        ]);
    }

    public function test_daily_challenge_rejects_non_challenge_photo(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $otherPhoto = Photo::factory()->approved()->create([
            'venue_id' => Venue::factory()->create()->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/other.webp',
        ]);

        $generator = app(DailyChallengeGenerator::class);
        $challenge = $generator->generateDraft(now());
        $generator->publish($challenge);

        $challenge->photos()->where('photo_id', $photo->id)->delete();
        DailyChallengePhoto::query()->where('daily_challenge_id', $challenge->id)->where('photo_id', '!=', $otherPhoto->id)->delete();

        $response = $this->actingAs($user)->postJson('/api/daily-challenge/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertStatus(422);
    }

    public function test_generate_daily_challenge_command(): void
    {
        $venue = Venue::factory()->create();

        Photo::factory()->approved()->count(5)->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $this->artisan('guesseat:daily-challenge')
            ->expectsOutputToContain('Daily challenge for')
            ->assertSuccessful();

        $this->assertDatabaseHas('daily_challenges', [
            'date' => now()->format('Y-m-d'),
            'status' => 'draft',
        ]);
    }
}

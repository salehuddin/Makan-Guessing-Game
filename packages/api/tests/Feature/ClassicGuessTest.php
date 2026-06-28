<?php

namespace Tests\Feature;

use App\Models\Guess;
use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClassicGuessTest extends TestCase
{
    use RefreshDatabase;

    public function test_play_returns_photo_with_four_options(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create(['district' => 'Bangsar']);

        Venue::factory()->count(3)->create(['district' => 'Bangsar']);

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $response = $this->actingAs($user)->postJson('/api/play/classic');

        $response->assertOk();
        $response->assertJsonStructure([
            'photo' => ['id', 'censored_url', 'category', 'submitter'],
            'options',
        ]);

        $response->assertJsonMissing(['correct_venue_id']);

        $this->assertCount(4, $response->json('options'));

        $optionIds = collect($response->json('options'))->pluck('id');
        $this->assertContains($photo->venue_id, $optionIds);
    }

    public function test_play_excludes_photos_already_guessed(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        Guess::create([
            'photo_id' => $photo->id,
            'guesser_id' => $user->id,
            'actual_pin' => DB::raw('ST_SetSRID(ST_MakePoint(101.68, 3.13), 4326)::geography'),
            'time_ms' => 5000,
            'is_correct_name' => true,
            'score' => 100,
        ]);

        $response = $this->actingAs($user)->postJson('/api/play/classic');

        $response->assertStatus(404);
    }

    public function test_play_excludes_own_photos(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $user->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $response = $this->actingAs($user)->postJson('/api/play/classic');

        $response->assertStatus(404);
    }

    public function test_play_requires_authentication(): void
    {
        $response = $this->postJson('/api/play/classic');

        $response->assertUnauthorized();
    }

    public function test_correct_guess_returns_score_and_result(): void
    {
        $user = User::factory()->create(['guesser_streak' => 2]);
        $venue = Venue::factory()->create();
        $otherVenue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
            'total_guesses' => 15,
            'total_guess_time_ms' => 150000,
            'avg_guess_time_ms' => 10000,
            'correct_guesses' => 7,
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertOk();
        $response->assertJsonPath('is_correct_name', true);
        $response->assertJsonPath('correct_venue_name', $venue->name);
        $response->assertJsonStructure([
            'guess_id',
            'is_correct_name',
            'score',
            'breakdown',
            'streak',
            'correct_venue_id',
            'correct_venue_name',
        ]);

        $this->assertGreaterThan(0, $response->json('score'));

        $this->assertDatabaseHas('guesses', [
            'photo_id' => $photo->id,
            'guesser_id' => $user->id,
            'is_correct_name' => true,
        ]);

        $photo->refresh();
        $this->assertSame(16, $photo->total_guesses);
        $this->assertSame(8, $photo->correct_guesses);

        $user->refresh();
        $this->assertSame($response->json('score'), $user->guesser_score_total);
        $this->assertSame(1, $user->guesses_played_count);
        $this->assertSame(1, $user->correct_guesses_count);
        $this->assertSame(1, $user->guesser_streak);
        $this->assertSame(1, $user->best_guess_streak);
        $this->assertSame(9563, $photo->avg_guess_time_ms);
        $this->assertSame(153000, $photo->total_guess_time_ms);
    }

    public function test_speed_multiplier_uses_photo_average_guess_time(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
            'avg_guess_time_ms' => 20000,
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 10000,
        ]);

        $response->assertOk();
        $response->assertJsonPath('breakdown.speed_multiplier', 1.5);
    }

    public function test_guess_awards_engagement_dividend_to_submitter(): void
    {
        $guesser = User::factory()->create();
        $submitter = User::factory()->create(['xp_total' => 0]);
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'censored_url' => 'censored/test.webp',
            'engagement_xp_awarded' => 199,
        ]);

        $response = $this->actingAs($guesser)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertOk();

        $submitter->refresh();
        $photo->refresh();

        $this->assertSame(1, $submitter->xp_total);
        $this->assertSame(200, $photo->engagement_xp_awarded);
        $this->assertDatabaseHas('xp_events', [
            'user_id' => $submitter->id,
            'photo_id' => $photo->id,
            'type' => 'engagement_dividend',
            'amount' => 1,
        ]);
    }

    public function test_engagement_dividend_is_capped_per_photo(): void
    {
        $guesser = User::factory()->create();
        $submitter = User::factory()->create(['xp_total' => 0]);
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => $submitter->id,
            'censored_url' => 'censored/test.webp',
            'engagement_xp_awarded' => 200,
        ]);

        $response = $this->actingAs($guesser)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertOk();

        $submitter->refresh();
        $photo->refresh();

        $this->assertSame(0, $submitter->xp_total);
        $this->assertSame(200, $photo->engagement_xp_awarded);
    }

    public function test_incorrect_guess_returns_zero_score(): void
    {
        $user = User::factory()->create(['guesser_streak' => 3]);
        $venue = Venue::factory()->create();
        $wrongVenue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $wrongVenue->id,
            'time_ms' => 5000,
        ]);

        $response->assertOk();
        $response->assertJsonPath('is_correct_name', false);
        $response->assertJsonPath('score', 0);
        $response->assertJsonPath('streak', 0);

        $user->refresh();
        $this->assertSame(1, $user->guesses_played_count);
        $this->assertSame(0, $user->correct_guesses_count);
        $this->assertSame(0, $user->guesser_streak);
    }

    public function test_cannot_guess_same_photo_twice(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'censored_url' => 'censored/test.webp',
        ]);

        $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_guess_non_approved_photo(): void
    {
        $user = User::factory()->create();
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->create([
            'venue_id' => $venue->id,
            'submitter_id' => User::factory()->create()->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertStatus(422);
    }

    public function test_guess_requires_authentication(): void
    {
        $venue = Venue::factory()->create();

        $photo = Photo::factory()->approved()->create([
            'venue_id' => $venue->id,
        ]);

        $response = $this->postJson('/api/guesses', [
            'photo_id' => $photo->id,
            'guessed_venue_id' => $venue->id,
            'time_ms' => 3000,
        ]);

        $response->assertUnauthorized();
    }
}

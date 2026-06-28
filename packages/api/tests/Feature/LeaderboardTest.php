<?php

namespace Tests\Feature;

use App\Models\Photo;
use App\Models\User;
use App\Models\Venue;
use App\Models\XpEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guesser_leaderboard_ranks_by_total_score(): void
    {
        $authUser = User::factory()->create();
        $top = User::factory()->create(['guesser_score_total' => 500, 'guesses_played_count' => 5, 'correct_guesses_count' => 4, 'best_guess_streak' => 3]);
        $second = User::factory()->create(['guesser_score_total' => 300, 'guesses_played_count' => 5, 'correct_guesses_count' => 5, 'best_guess_streak' => 5]);

        $response = $this->actingAs($authUser)->getJson('/api/leaderboards/guessers');

        $response->assertOk();
        $response->assertJsonPath('data.0.rank', 1);
        $response->assertJsonPath('data.0.user_id', $top->id);
        $response->assertJsonPath('data.1.user_id', $second->id);
    }

    public function test_submitter_leaderboard_ranks_by_xp_total(): void
    {
        $authUser = User::factory()->create();
        $top = User::factory()->create(['xp_total' => 1000, 'approved_count' => 3]);
        $second = User::factory()->create(['xp_total' => 800, 'approved_count' => 10]);

        $response = $this->actingAs($authUser)->getJson('/api/leaderboards/submitters');

        $response->assertOk();
        $response->assertJsonPath('data.0.user_id', $top->id);
        $response->assertJsonPath('data.1.user_id', $second->id);
    }

    public function test_submitter_leaderboard_supports_period_and_filters(): void
    {
        $authUser = User::factory()->create();
        $venue = Venue::factory()->create(['district' => 'Bangsar']);
        $otherVenue = Venue::factory()->create(['district' => 'KLCC']);
        $top = User::factory()->create();
        $other = User::factory()->create();
        $photo = Photo::factory()->approved()->create(['venue_id' => $venue->id, 'submitter_id' => $top->id, 'category' => 'signature_dish']);
        $otherPhoto = Photo::factory()->approved()->create(['venue_id' => $otherVenue->id, 'submitter_id' => $other->id, 'category' => 'ambience']);

        XpEvent::create(['user_id' => $top->id, 'photo_id' => $photo->id, 'type' => 'photo_approved', 'amount' => 500]);
        XpEvent::create(['user_id' => $other->id, 'photo_id' => $otherPhoto->id, 'type' => 'photo_approved', 'amount' => 900]);

        $response = $this->actingAs($authUser)->getJson('/api/leaderboards/submitters?period=weekly&district=Bangsar&category=signature_dish');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.user_id', $top->id);
        $response->assertJsonPath('data.0.xp_total', 500);
    }

    public function test_leaderboards_require_authentication(): void
    {
        $this->getJson('/api/leaderboards/guessers')->assertUnauthorized();
        $this->getJson('/api/leaderboards/submitters')->assertUnauthorized();
    }
}

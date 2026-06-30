<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['username', 'phone', 'email', 'email_verified_at', 'password', 'trust_tier', 'xp_total', 'guesser_score_total', 'guesses_played_count', 'correct_guesses_count', 'submitter_streak', 'guesser_streak', 'best_guess_streak', 'approved_count', 'rejected_count', 'district', 'profile_bio', 'avatar_url', 'cover_url', 'language', 'notifications_enabled', 'profile_visibility', 'is_admin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'phone_verified_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'xp_total' => 'integer',
            'guesser_score_total' => 'integer',
            'guesses_played_count' => 'integer',
            'correct_guesses_count' => 'integer',
            'submitter_streak' => 'integer',
            'guesser_streak' => 'integer',
            'best_guess_streak' => 'integer',
            'approved_count' => 'integer',
            'rejected_count' => 'integer',
            'is_admin' => 'boolean',
            'notifications_enabled' => 'boolean',
        ];
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class, 'submitter_id');
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class, 'guesser_id');
    }

    public function claimedVenues(): HasMany
    {
        return $this->hasMany(Venue::class, 'claimed_by');
    }

    public function xpEvents(): HasMany
    {
        return $this->hasMany(XpEvent::class);
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'photo_id', 'guesser_id', 'guessed_venue_id',
    'guessed_pin', 'actual_pin', 'distance_meters',
    'time_ms', 'is_correct_name', 'score',
    'game_mode_slug', 'daily_challenge_id', 'shown_option_ids', 'answered_at',
])]
class Guess extends Model
{
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $casts = [
        'distance_meters' => 'float',
        'time_ms' => 'integer',
        'is_correct_name' => 'boolean',
        'score' => 'integer',
        'shown_option_ids' => 'array',
        'answered_at' => 'datetime',
    ];

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function guesser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guesser_id');
    }

    public function guessedVenue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'guessed_venue_id');
    }

    public function dailyChallenge(): BelongsTo
    {
        return $this->belongsTo(DailyChallenge::class);
    }

    public function xpEvents(): HasMany
    {
        return $this->hasMany(XpEvent::class);
    }
}

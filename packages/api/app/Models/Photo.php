<?php

namespace App\Models;

use App\Casts\TextArray;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'venue_id', 'submitter_id', 'category', 'secondary_tags',
    'auto_category', 'auto_category_confidence', 'category_flags',
    'censored_url', 'original_url', 'thumbnail_url',
    'exif_gps', 'phash', 'quality_score', 'status',
    'client_censored', 'server_flags', 'needs_human_review',
    'total_guesses', 'total_guess_time_ms', 'avg_guess_time_ms', 'avg_rating', 'correct_guesses', 'engagement_xp_awarded',
])]
class Photo extends Model
{
    use HasFactory, HasUuids;

    public const CATEGORIES = [
        'signature_dish', 'ambience', 'exterior', 'table_setting',
        'staff_uniforms', 'menu_signage', 'general',
    ];

    public const STATUSES = ['pending', 'approved', 'quarantined', 'rejected'];

    protected $casts = [
        'secondary_tags' => TextArray::class,
        'auto_category_confidence' => 'float',
        'quality_score' => 'float',
        'server_flags' => 'array',
        'client_censored' => 'boolean',
        'needs_human_review' => 'boolean',
        'total_guesses' => 'integer',
        'total_guess_time_ms' => 'integer',
        'avg_guess_time_ms' => 'integer',
        'avg_rating' => 'float',
        'correct_guesses' => 'integer',
        'engagement_xp_awarded' => 'integer',
        'category_flags' => 'integer',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitter_id');
    }

    public function guesses(): HasMany
    {
        return $this->hasMany(Guess::class);
    }

    public function xpEvents(): HasMany
    {
        return $this->hasMany(XpEvent::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}

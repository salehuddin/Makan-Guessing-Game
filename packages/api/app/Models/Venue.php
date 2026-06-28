<?php

namespace App\Models;

use App\Casts\TextArray;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'address', 'location', 'district', 'venue_type', 'cuisine_tags', 'price_range', 'halal_status', 'claimed_by', 'first_submitted_by', 'google_place_id'])]
class Venue extends Model
{
    use HasFactory, HasUuids;

    public const VENUE_TYPES = [
        'restaurant',
        'mamak',
        'kopitiam',
        'hawker_stall',
        'warung',
        'cafe',
        'food_court',
        'chain',
    ];

    public const HALAL_STATUSES = [
        'halal',
        'non_halal',
        'muslim_friendly',
        'unknown',
    ];

    protected $casts = [
        'price_range' => 'integer',
        'cuisine_tags' => TextArray::class,
    ];

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function firstSubmittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'first_submitted_by');
    }

    public function scopeWithinDistance($query, float $lat, float $lng, int $meters)
    {
        return $query->whereRaw(
            'ST_DWithin(location, ST_MakePoint(?, ?)::geography, ?)',
            [$lng, $lat, $meters]
        );
    }

    public function scopeSearchByName($query, string $name)
    {
        return $query->whereRaw('name ILIKE ?', ['%'.$name.'%']);
    }
}

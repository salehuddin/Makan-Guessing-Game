<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'platform', 'ad_type', 'placement', 'reward_type', 'guess_id', 'reward_amount', 'ad_unit_id', 'network', 'viewed_at'])]
class AdView extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $casts = [
        'reward_amount' => 'integer',
        'viewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guess(): BelongsTo
    {
        return $this->belongsTo(Guess::class);
    }
}

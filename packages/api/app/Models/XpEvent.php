<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'photo_id', 'guess_id', 'type', 'amount', 'breakdown'])]
class XpEvent extends Model
{
    public const UPDATED_AT = null;

    protected $casts = [
        'amount' => 'integer',
        'breakdown' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function guess(): BelongsTo
    {
        return $this->belongsTo(Guess::class);
    }
}

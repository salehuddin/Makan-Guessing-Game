<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['date', 'title', 'status', 'generated_by', 'published_at'])]
class DailyChallenge extends Model
{
    use HasFactory, HasUuids;

    public const STATUSES = ['draft', 'scheduled', 'published', 'archived'];

    protected $casts = [
        'date' => 'date',
        'published_at' => 'datetime',
    ];

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(DailyChallengePhoto::class)->orderBy('position');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'scheduled'], true);
    }
}

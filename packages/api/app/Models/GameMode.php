<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'name', 'description', 'enabled', 'is_builtin', 'round_count', 'option_count', 'category_filter', 'district_filter', 'selection_strategy', 'settings'])]
class GameMode extends Model
{
    protected $casts = [
        'enabled' => 'boolean',
        'is_builtin' => 'boolean',
        'round_count' => 'integer',
        'option_count' => 'integer',
        'settings' => 'array',
    ];

    public const BUILTIN = ['classic', 'daily'];

    public const STRATEGIES = [
        'weighted_random' => 'Weighted Random',
        'curated_daily' => 'Curated Daily',
        'fixed_sequence' => 'Fixed Sequence',
    ];

    public function isProtected(): bool
    {
        return $this->is_builtin && in_array($this->slug, self::BUILTIN, true);
    }
}

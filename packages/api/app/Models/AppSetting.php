<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value', 'type', 'group', 'label', 'description', 'is_public'])]
class AppSetting extends Model
{
    protected $table = 'settings';

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function getValueAttribute(mixed $value): mixed
    {
        $decoded = json_decode($value ?? 'null', true);

        return match ($this->type) {
            'boolean' => (bool) $decoded,
            'integer' => (int) $decoded,
            'json' => is_array($decoded) ? $decoded : [],
            default => $decoded === null ? '' : (string) $decoded,
        };
    }

    public function setValueAttribute(mixed $value): void
    {
        $this->attributes['value'] = json_encode($value);
    }

    public function castValue(): mixed
    {
        return $this->value;
    }
}

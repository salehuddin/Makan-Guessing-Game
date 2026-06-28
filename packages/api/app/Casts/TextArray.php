<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class TextArray implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        $trimmed = trim($value, '{}');

        if ($trimmed === '') {
            return [];
        }

        return array_map(fn ($item) => trim($item, '"'), explode(',', $trimmed));
    }

    public function set($model, string $key, $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        $escaped = array_map(fn ($item) => '"'.str_replace('"', '\\"', $item).'"', $value);

        return '{'.implode(',', $escaped).'}';
    }
}

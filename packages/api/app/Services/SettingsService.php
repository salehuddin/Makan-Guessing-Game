<?php

namespace App\Services;

use App\Models\AppSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    private const CACHE_KEY = 'guesseat:settings';

    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->get($key);

        if ($value === null) {
            return $default;
        }

        return is_bool($value) ? $value : (bool) $value;
    }

    public function int(string $key, int $default = 0): int
    {
        $value = $this->get($key);

        if ($value === null) {
            return $default;
        }

        return (int) $value;
    }

    public function string(string $key, string $default = ''): string
    {
        $value = $this->get($key);

        if ($value === null) {
            return $default;
        }

        return (string) $value;
    }

    public function json(string $key, array $default = []): array
    {
        $value = $this->get($key);

        if (! is_array($value)) {
            return $default;
        }

        return $value;
    }

    public function get(string $key): mixed
    {
        return $this->all()->get($key);
    }

    public function all(): Collection
    {
        return collect(Cache::rememberForever(self::CACHE_KEY, function () {
            return AppSetting::all()->pluck('value', 'key')->toArray();
        }));
    }

    public function set(string $key, mixed $value): void
    {
        $setting = AppSetting::where('key', $key)->first();

        if ($setting) {
            $setting->update(['value' => $value]);
        }
    }

    public function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            $this->set($key, $value);
        }

        $this->flushCache();
    }

    public function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function public(): Collection
    {
        return AppSetting::where('is_public', true)->pluck('value', 'key');
    }
}

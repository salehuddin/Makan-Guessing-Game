<?php

namespace App\Services;

use App\Models\IntegrationSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class IntegrationService
{
    private const CACHE_KEY = 'guesseat:integrations';

    public function enabled(string $key): bool
    {
        $integration = $this->all()->get($key);

        return $integration !== null && $integration['enabled'] === true;
    }

    public function get(string $key): ?IntegrationSetting
    {
        return IntegrationSetting::where('key', $key)->first();
    }

    public function all(): Collection
    {
        return collect(Cache::rememberForever(self::CACHE_KEY, function () {
            return IntegrationSetting::all()->keyBy('key')->map(function (IntegrationSetting $integration) {
                return [
                    'key' => $integration->key,
                    'label' => $integration->label,
                    'enabled' => $integration->enabled,
                    'mode' => $integration->mode,
                    'last_status' => $integration->last_status,
                    'last_error' => $integration->last_error,
                    'last_checked_at' => $integration->last_checked_at?->toIso8601String(),
                ];
            })->toArray();
        }));
    }

    public function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function setEnabledForTesting(string $key, bool $enabled): void
    {
        IntegrationSetting::where('key', $key)->update(['enabled' => $enabled]);
        $this->flushCache();
    }
}

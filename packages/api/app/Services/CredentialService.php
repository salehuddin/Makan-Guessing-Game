<?php

namespace App\Services;

use App\Models\IntegrationSetting;

class CredentialService
{
    /** @var array<string, ?string> */
    private array $cache = [];

    public function get(string $integrationKey, string $field): ?string
    {
        $cacheKey = "{$integrationKey}.{$field}";

        if (array_key_exists($cacheKey, $this->cache)) {
            return $this->cache[$cacheKey];
        }

        $credentials = IntegrationSetting::CREDENTIAL_FIELDS[$integrationKey] ?? [];
        $spec = $credentials[$field] ?? null;

        if ($spec === null) {
            return $this->cache[$cacheKey] = null;
        }

        $integration = IntegrationSetting::where('key', $integrationKey)->first();
        $storedSettings = $integration?->settings ?? [];
        $storedValue = $storedSettings[$field] ?? null;

        if (! empty($storedValue)) {
            return $this->cache[$cacheKey] = $storedValue;
        }

        $envVar = $spec['env'] ?? null;
        $envValue = $envVar ? getenv($envVar) : null;

        return $this->cache[$cacheKey] = ($envValue && $envValue !== false) ? $envValue : null;
    }

    /** @return array<string, ?string> */
    public function all(string $integrationKey): array
    {
        $fields = array_keys(IntegrationSetting::CREDENTIAL_FIELDS[$integrationKey] ?? []);
        $result = [];
        foreach ($fields as $field) {
            $result[$field] = $this->get($integrationKey, $field);
        }

        return $result;
    }

    public function isConfigured(string $integrationKey): bool
    {
        $fields = IntegrationSetting::CREDENTIAL_FIELDS[$integrationKey] ?? [];
        if (empty($fields)) {
            return true;
        }

        foreach (array_keys($fields) as $field) {
            if (empty($this->get($integrationKey, $field))) {
                return false;
            }
        }

        return true;
    }

    public function bootstrapConfigs(): void
    {
        foreach (IntegrationSetting::CREDENTIAL_FIELDS as $integrationKey => $fields) {
            foreach (array_keys($fields) as $field) {
                $value = $this->get($integrationKey, $field);
                if (! empty($value)) {
                    $configKey = $this->mapFieldToConfig($integrationKey, $field);
                    if ($configKey) {
                        config([$configKey => $value]);
                    }
                }
            }
        }
    }

    private function mapFieldToConfig(string $integrationKey, string $field): ?string
    {
        return match ("{$integrationKey}.{$field}") {
            'google_auth.client_id' => 'services.google.client_id',
            'facebook_auth.client_id' => 'services.facebook.client_id',
            'apple_auth.client_id' => 'services.apple.client_id',
            'tiktok_auth.client_key' => 'services.tiktok.client_key',

            'twilio.sid' => 'services.twilio.sid',
            'twilio.auth_token' => 'services.twilio.auth_token',
            'twilio.verify_service_sid' => 'services.twilio.verify_service_sid',

            'r2.access_key_id' => 'filesystems.disks.r2.key',
            'r2.secret_access_key' => 'filesystems.disks.r2.secret',
            'r2.bucket' => 'filesystems.disks.r2.bucket',
            'r2.endpoint' => 'filesystems.disks.r2.endpoint',

            'redis.host' => 'database.redis.cache.host',
            'redis.port' => 'database.redis.cache.port',
            'redis.password' => 'database.redis.cache.password',

            'reverb.app_id' => 'reverb.apps.0.id',
            'reverb.app_key' => 'reverb.apps.0.key',
            'reverb.app_secret' => 'reverb.apps.0.secret',

            'google_vision.credentials' => 'services.google_vision.credentials',
            'google_maps.api_key' => 'services.google_maps.api_key',

            default => null,
        };
    }

    public function flushCache(): void
    {
        $this->cache = [];
    }

    public static function maskValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (strlen($value) <= 8) {
            return '••••';
        }

        return '••••'.substr($value, -4);
    }
}

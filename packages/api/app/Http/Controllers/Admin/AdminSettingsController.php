<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminSettingsController extends Controller
{
    private const ENUM_VALUES = [
        'default_language' => ['en', 'ms'],
        'ads_provider_mobile' => ['google_admob', 'applovin', 'none'],
        'ads_provider_web' => ['google_adsense', 'none'],
    ];

    private const INTEGER_RANGES = [
        'classic_option_count' => ['min' => 2, 'max' => 8],
        'daily_round_count' => ['min' => 1, 'max' => 50],
        'underplayed_photo_threshold' => ['min' => 0, 'max' => 1000],
        'freshness_boost_days' => ['min' => 0, 'max' => 365],
        'ads_placement_interstitial_interval' => ['min' => 0, 'max' => 100],
    ];

    public function __construct(
        private SettingsService $settings,
    ) {}

    public function index(): JsonResponse
    {
        $settings = AppSetting::orderBy('group')
            ->orderBy('key')
            ->get();

        return response()->json([
            'data' => $settings->map(fn (AppSetting $setting) => $this->serialize($setting))->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ]);

        $existing = AppSetting::whereIn('key', array_keys($validated['settings']))
            ->pluck('key')
            ->all();

        $unknown = array_diff(array_keys($validated['settings']), $existing);

        if (count($unknown) > 0) {
            throw ValidationException::withMessages([
                'settings' => ['Unknown setting keys: '.implode(', ', $unknown).'.'],
            ]);
        }

        $settingsByKey = AppSetting::query()
            ->whereIn('key', $existing)
            ->get()
            ->keyBy('key');

        $clean = [];

        foreach ($validated['settings'] as $key => $value) {
            $setting = $settingsByKey->get($key);

            if ($setting === null) {
                continue;
            }

            $clean[$key] = $this->castAndValidate($key, $value, $setting);
        }

        $this->settings->setMany($clean);

        return response()->json([
            'message' => 'Settings updated.',
        ]);
    }

    private function castAndValidate(string $key, mixed $value, AppSetting $setting): mixed
    {
        $value = match ($setting->type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOL),
            'integer' => $value === null || $value === '' ? 0 : (int) $value,
            'json' => is_array($value) ? $value : [],
            default => $value === null ? '' : (string) $value,
        };

        if (array_key_exists($key, self::ENUM_VALUES)) {
            $allowed = self::ENUM_VALUES[$key];

            if (! in_array($value, $allowed, true)) {
                throw ValidationException::withMessages([
                    'settings.'.$key => ["{$key} must be one of: ".implode(', ', $allowed).'.'],
                ]);
            }
        }

        if ($setting->type === 'integer' && array_key_exists($key, self::INTEGER_RANGES)) {
            $range = self::INTEGER_RANGES[$key];

            if ($value < $range['min'] || $value > $range['max']) {
                throw ValidationException::withMessages([
                    'settings.'.$key => ["{$key} must be between {$range['min']} and {$range['max']}."],
                ]);
            }
        }

        return $value;
    }

    private function serialize(AppSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'key' => $setting->key,
            'value' => $setting->castValue(),
            'type' => $setting->type,
            'group' => $setting->group,
            'label' => $setting->label,
            'description' => $setting->description,
            'is_public' => $setting->is_public,
            'enum_values' => self::ENUM_VALUES[$setting->key] ?? null,
            'integer_range' => $setting->type === 'integer'
                ? (self::INTEGER_RANGES[$setting->key] ?? null)
                : null,
        ];
    }
}

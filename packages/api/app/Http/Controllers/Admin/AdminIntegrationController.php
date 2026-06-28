<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use App\Services\CredentialService;
use App\Services\IntegrationHealthService;
use App\Services\IntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminIntegrationController extends Controller
{
    private const MODES = ['dev', 'staging', 'production'];

    public function __construct(
        private IntegrationService $integrationService,
        private IntegrationHealthService $healthService,
        private CredentialService $credentialService,
    ) {}

    public function index(): JsonResponse
    {
        $integrations = IntegrationSetting::orderBy('key')->get();

        return response()->json([
            'data' => $integrations->map(fn (IntegrationSetting $integration) => $this->serialize($integration))->values(),
        ]);
    }

    public function update(Request $request, IntegrationSetting $integration): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'mode' => ['sometimes', 'string', Rule::in(self::MODES)],
            'settings' => ['sometimes', 'array'],
        ]);

        $updateData = [];
        if (array_key_exists('enabled', $validated)) {
            $updateData['enabled'] = $validated['enabled'];
        }
        if (array_key_exists('mode', $validated)) {
            $updateData['mode'] = $validated['mode'];
        }

        if (array_key_exists('settings', $validated)) {
            $existingSettings = $integration->settings ?? [];
            $newSettings = $validated['settings'];

            $cleanSettings = $existingSettings;
            $spec = IntegrationSetting::CREDENTIAL_FIELDS[$integration->key] ?? [];

            foreach ($spec as $field => $fieldSpec) {
                if (array_key_exists($field, $newSettings)) {
                    $val = $newSettings[$field];

                    if ($val === null || $val === '') {
                        $cleanSettings[$field] = null;

                        continue;
                    }

                    if (Str::startsWith($val, '••••')) {
                        continue;
                    }

                    $cleanSettings[$field] = $val;
                }
            }

            $updateData['settings'] = $cleanSettings;
        }

        $integration->update($updateData);

        $this->credentialService->flushCache();
        $this->integrationService->flushCache();

        return response()->json([
            'message' => 'Integration updated.',
            'data' => $this->serialize($integration),
        ]);
    }

    public function test(IntegrationSetting $integration): JsonResponse
    {
        $result = $this->healthService->test($integration);

        $integration->markChecked($result['status'], $result['error']);

        $this->integrationService->flushCache();

        return response()->json([
            'message' => $result['status'] === 'ok'
                ? 'Connection test succeeded.'
                : 'Connection test failed.',
            'data' => $this->serialize($integration),
        ]);
    }

    private function serialize(IntegrationSetting $integration): array
    {
        $spec = IntegrationSetting::CREDENTIAL_FIELDS[$integration->key] ?? [];
        $serializedFields = [];

        foreach ($spec as $field => $fieldSpec) {
            $resolvedValue = $this->credentialService->get($integration->key, $field);
            $hasValue = ! empty($resolvedValue);

            $serializedFields[] = [
                'key' => $field,
                'label' => $fieldSpec['label'],
                'secret' => $fieldSpec['secret'],
                'value' => $fieldSpec['secret']
                    ? CredentialService::maskValue($resolvedValue)
                    : $resolvedValue,
                'has_value' => $hasValue,
            ];
        }

        return [
            'id' => $integration->id,
            'key' => $integration->key,
            'label' => $integration->label,
            'description' => $integration->description,
            'enabled' => $integration->enabled,
            'mode' => $integration->mode,
            'settings' => $integration->settings,
            'last_status' => $integration->last_status,
            'last_error' => $integration->last_error,
            'last_checked_at' => $integration->last_checked_at?->toIso8601String(),
            'available_modes' => self::MODES,
            'credential_fields' => $serializedFields,
        ];
    }
}

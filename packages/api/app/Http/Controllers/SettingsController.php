<?php

namespace App\Http\Controllers;

use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(
        private SettingsService $settings,
    ) {}

    public function public(): JsonResponse
    {
        return response()->json([
            'settings' => $this->settings->public()->toArray(),
        ]);
    }
}

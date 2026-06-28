<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminGameModeController extends Controller
{
    public function index(): JsonResponse
    {
        $modes = GameMode::orderBy('is_builtin', 'desc')->orderBy('name')->get();

        return response()->json([
            'data' => $modes->map(fn (GameMode $mode) => [
                'id' => $mode->id,
                'slug' => $mode->slug,
                'name' => $mode->name,
                'description' => $mode->description,
                'enabled' => $mode->enabled,
                'is_builtin' => $mode->is_builtin,
                'is_protected' => $mode->isProtected(),
                'round_count' => $mode->round_count,
                'option_count' => $mode->option_count,
                'category_filter' => $mode->category_filter,
                'district_filter' => $mode->district_filter,
                'selection_strategy' => $mode->selection_strategy,
                'settings' => $mode->settings,
                'updated_at' => $mode->updated_at,
            ])->values(),
        ]);
    }

    public function update(Request $request, GameMode $gameMode): JsonResponse
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'enabled' => ['sometimes', 'boolean'],
            'round_count' => ['sometimes', 'nullable', 'integer', 'between:1,50'],
            'option_count' => ['sometimes', 'integer', 'between:2,8'],
            'category_filter' => ['sometimes', 'nullable', 'string'],
            'district_filter' => ['sometimes', 'nullable', 'string'],
            'settings' => ['sometimes', 'array'],
        ];

        if (! $gameMode->isProtected()) {
            $rules['selection_strategy'] = ['sometimes', Rule::in(GameMode::STRATEGIES)];
        }

        $validated = $request->validate($rules);

        $gameMode->update($validated);

        return response()->json([
            'message' => 'Game mode updated.',
            'data' => [
                'id' => $gameMode->id,
                'slug' => $gameMode->slug,
                'name' => $gameMode->name,
                'description' => $gameMode->description,
                'enabled' => $gameMode->enabled,
                'is_builtin' => $gameMode->is_builtin,
                'is_protected' => $gameMode->isProtected(),
                'round_count' => $gameMode->round_count,
                'option_count' => $gameMode->option_count,
                'category_filter' => $gameMode->category_filter,
                'district_filter' => $gameMode->district_filter,
                'selection_strategy' => $gameMode->selection_strategy,
                'settings' => $gameMode->settings,
                'updated_at' => $gameMode->updated_at,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['sometimes', 'string', 'min:3', 'max:50', Rule::unique('users', 'username')->ignore($request->user()->id)],
            'district' => ['sometimes', 'nullable', 'string', 'max:80'],
            'profile_bio' => ['sometimes', 'nullable', 'string', 'max:160'],
            'avatar_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'cover_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ]);

        $user = $request->user();
        $user->fill($validated);
        $user->save();

        return response()->json(['user' => $user->refresh()]);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Auth\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthController
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['nullable', 'string', 'max:30', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'device_name' => ['required', 'string', 'max:100'],
        ]);

        $user = User::create([
            'username' => $validated['username'] ?? $this->generateUsername($validated['email']),
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        return $this->tokenResponse($user, $validated['device_name']);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:100'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return $this->tokenResponse($user, $validated['device_name']);
    }

    public function social(Request $request, SocialAuthService $socialAuth): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in(['google', 'facebook', 'apple', 'tiktok'])],
            'token' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:100'],
        ]);

        try {
            $profile = $socialAuth->verify($validated['provider'], $validated['token']);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $account = SocialAccount::where('provider', $validated['provider'])
            ->where('provider_id', $profile['provider_id'])
            ->first();

        if ($account) {
            return $this->tokenResponse($account->user, $validated['device_name']);
        }

        $user = $profile['email']
            ? User::where('email', $profile['email'])->first()
            : null;

        if (! $user) {
            $user = User::create([
                'username' => $this->generateUsername($profile['email'] ?? $profile['name'] ?? $profile['provider_id']),
                'email' => $profile['email'],
                'email_verified_at' => $profile['email'] ? now() : null,
            ]);
        }

        $user->socialAccounts()->create([
            'provider' => $validated['provider'],
            'provider_id' => $profile['provider_id'],
        ]);

        return $this->tokenResponse($user, $validated['device_name']);
    }

    private function tokenResponse(User $user, string $deviceName): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken($deviceName)->plainTextToken,
            'user' => $user->refresh(),
        ]);
    }

    private function generateUsername(string $seed): string
    {
        $base = Str::of($seed)
            ->before('@')
            ->lower()
            ->replaceMatches('/[^a-z0-9_]/', '')
            ->limit(24, '')
            ->value() ?: 'makan';

        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.$suffix;
            $suffix++;
        }

        return $username;
    }
}

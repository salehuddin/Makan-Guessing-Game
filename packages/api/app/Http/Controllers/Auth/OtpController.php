<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Services\Otp\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController
{
    public function __construct(private OtpService $otp) {}

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+601[0-9]{8,9}$/'],
        ]);

        $this->otp->send($validated['phone']);

        return response()->json(['message' => 'OTP sent']);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+601[0-9]{8,9}$/'],
            'code' => ['required', 'string', 'size:6'],
            'username' => ['sometimes', 'string', 'max:30'],
            'device_name' => ['required', 'string', 'max:100'],
        ]);

        if (! $this->otp->verify($validated['phone'], $validated['code'])) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $user = User::firstOrCreate(
            ['phone' => $validated['phone']],
            [
                'phone_verified_at' => now(),
                'username' => $validated['username'] ?? $this->generateUsername($validated['phone']),
            ],
        );

        if (! $user->phone_verified_at) {
            $user->forceFill(['phone_verified_at' => now()])->save();
        }

        $token = $user->createToken($validated['device_name'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function generateUsername(string $phone): string
    {
        $base = 'makan'.substr($phone, -4);

        $count = User::where('username', 'like', "{$base}%")->count();

        return $count > 0 ? "{$base}{$count}" : $base;
    }
}
